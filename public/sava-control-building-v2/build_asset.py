import os, json, math, struct, zipfile
import numpy as np
import trimesh
from trimesh.transformations import rotation_matrix
ROOT=os.path.dirname(os.path.abspath(__file__))
parts={k:[] for k in ('CB_WALLS','CB_ROOF','CB_WINDOWS','CB_DETAILS')}
colors={'CB_WALLS':[237,240,234,255],'CB_ROOF':[103,129,145,255],'CB_WINDOWS':[34,48,59,255],'CB_DETAILS':[105,137,152,255]}
def box(group, size, center, angle=0):
 m=trimesh.creation.box(extents=size)
 if angle: m.apply_transform(rotation_matrix(angle,[1,0,0]))
 m.apply_translation(center);parts[group].append(m)
def cylinder(group,radius,height,center,sections=10,axis='y'):
 m=trimesh.creation.cylinder(radius=radius,height=height,sections=sections)
 if axis=='y':m.apply_transform(rotation_matrix(math.pi/2,[1,0,0]))
 elif axis=='x':m.apply_transform(rotation_matrix(math.pi/2,[0,1,0]))
 m.apply_translation(center);parts[group].append(m)
# foundation and walls, all inside footprint
box('CB_WALLS',(5.72,.14,3.72),(0,.07,0))
box('CB_WALLS',(5.68,3.04,3.64),(0,1.65,0))
# facade seam and shallow joints
for x in (-2.78,2.78):box('CB_DETAILS',(.022,2.9,.018),(x,1.7,1.829))
# simple gabled roof, two actual inclined surfaces
half=1.96; rise=.23; length=math.hypot(half,rise)
for side in (-1,1):
 angle=side*math.atan2(rise,half)
 box('CB_ROOF',(6.0,.065,length),(0,3.285,side*.98),angle)
# ridge cap, fascia and subtle roof seam lines
box('CB_ROOF',(6.0,.045,.10),(0,3.4775,0))
for x in (-2.94,2.94):
 for z in (-1,1): box('CB_ROOF',(.035,.085,1.97),(x,3.265,z*.98),z*math.atan2(rise,half))
for x in (-1.8,-.6,.6,1.8):
 for z in (-1,1):box('CB_DETAILS',(.016,.014,1.93),(x,3.33,z*.98),z*math.atan2(rise,half))
# main door front +Z, dark door panel w border + pull
box('CB_DETAILS',(1.10,2.28,.040),(-.81,1.285,1.84))
box('CB_WINDOWS',(.96,2.16,.026),(-.81,1.29,1.868))
box('CB_DETAILS',(.035,.24,.060),(-.37,1.22,1.915))
# opaque windows two front one side
for x in (.62,1.87):
 box('CB_DETAILS',(1.04,1.0,.032),(x,1.93,1.84))
 box('CB_WINDOWS',(.94,.90,.024),(x,1.93,1.865))
 box('CB_DETAILS',(1.04,.028,.065),(x,1.435,1.88))
# side window finished, near right x face
box('CB_DETAILS',(.034,.9,1.08),(2.854,1.98,-.50))
box('CB_WINDOWS',(.027,.82,.99),(2.882,1.98,-.50))
# shallow entry canopy fully within envelope
box('CB_ROOF',(1.68,.08,.58),(-.79,2.59,1.67))
for x in (-1.53,-.05):box('CB_DETAILS',(.045,.48,.045),(x,2.32,1.41))
# blank signage panel, no lettering
box('CB_WALLS',(1.13,.29,.026),(.9,2.73,1.844))
# back ventilation panels
for x in (-1.68,1.72):
 box('CB_DETAILS',(.82,.46,.034),(x,2.28,-1.842))
 for j in range(4):box('CB_WINDOWS',(.67,.025,.045),(x,2.12+j*.09,-1.874))
# small fascia along eave front/back
for z in (-1.95,1.95):box('CB_ROOF',(6,.08,.10),(0,3.175,z))
scene=trimesh.Scene()
merged={}
for name,meshes in parts.items():
 m=trimesh.util.concatenate(meshes)
 m.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(name=name,baseColorFactor=colors[name],metallicFactor=(.48 if name in ('CB_ROOF','CB_DETAILS') else .12),roughnessFactor=(.48 if name in ('CB_ROOF','CB_DETAILS') else .76),doubleSided=False))
 merged[name]=m; scene.add_geometry(m,geom_name=name,node_name=name)
scene.graph.update(frame_to='ANCHOR_LABEL',frame_from='world',matrix=trimesh.transformations.translation_matrix([0,3.76,1.55]))
scene.graph.update(frame_to='ANCHOR_STATUS',frame_from='world',matrix=trimesh.transformations.translation_matrix([2.22,2.65,1.9]))
output=os.path.join(ROOT,'control-building.glb')
with open(output,'wb') as f:f.write(trimesh.exchange.gltf.export_glb(scene))
# inspect EXPORTED artifact and read glTF JSON directly
with open(output,'rb') as f:data=f.read()
magic,ver,size=struct.unpack_from('<4sII',data,0)
assert magic==b'glTF' and ver==2 and size==len(data)
chunk_size,chunk_type=struct.unpack_from('<I4s',data,12)
gltf=json.loads(data[20:20+chunk_size].decode().rstrip(' \x00'))
reloaded=trimesh.load(output,force='scene')
meshes=list(reloaded.geometry.values());bounds=np.array(reloaded.bounds)
tris=sum(len(m.faces) for m in meshes)
primitive_count=sum(len(x['primitives']) for x in gltf['meshes'])
materials=[x['name'] for x in gltf.get('materials',[])]
nodes=[x['name'] for x in gltf.get('nodes',[]) if 'name' in x]
assert len(materials)<=4 and primitive_count<=4 and tris<=6000
assert np.max(np.abs(bounds[1]-[3,3.5,2]))<.003,(bounds[1])
assert np.max(np.abs(bounds[0]-[-3,0,-2]))<.003,(bounds[0])
assert 'ANCHOR_LABEL' in nodes and 'ANCHOR_STATUS' in nodes
manifest={'asset':'control-building.glb','asset_contract':'SAVA Solar Farm One, meters, Y-up, +Z front','description':'Single story solar farm operations support building; representative only','measured_from':'exported glTF 2.0 binary','bounding_box_local_xyz':{'min':bounds[0].tolist(),'max':bounds[1].tolist()},'dimensions_xyz_m':(bounds[1]-bounds[0]).tolist(),'triangles_after_triangulation':tris,'render_primitives':primitive_count,'materials':materials,'render_meshes':list(merged),'texture_resolutions':[],'file_bytes':len(data),'nodes':nodes,'pivot_xyz':[0,0,0],'anchors_xyz':{'ANCHOR_LABEL':[0,3.76,1.55],'ANCHOR_STATUS':[2.22,2.65,1.9]},'provenance':'All geometry and material values generated from original parametric code; no external assets','limitations':['Not an engineering-certified building','Blender source not executed in this environment','Khronos glTF Validator not available','Three.js integration not run']}
open(os.path.join(ROOT,'asset_manifest.json'),'w').write(json.dumps(manifest,indent=2))
open(os.path.join(ROOT,'validation_report.json'),'w').write(json.dumps({'passed':['Binary GLB v2 header','Exported GLB reopened','Dimensions, pivot and height bounds','Triangle cap','Materials and primitives','Anchors present'],'not_run':['Khronos glTF Validator','Blender reproduction script','Three.js/R3F integration'],'warnings':[]},indent=2))
print(json.dumps({k:manifest[k] for k in ('dimensions_xyz_m','triangles_after_triangulation','render_primitives','materials','file_bytes')},indent=2))
