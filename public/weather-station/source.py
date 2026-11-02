"""SAVA weather station — Blender 4.2+ standalone procedural builder.
Run: blender -b --python source.py
Uses Blender built-in bpy and Python standard library only when run in Blender.
The non-Blender branch uses installed trimesh for independent local GLB inspection/export.
Original procedural geometry; no third-party geometry or texture assets.
"""
import math, json, os
from collections import defaultdict
OUT = os.path.dirname(os.path.abspath(__file__))
COLORS = {
 'MET_MAST':((0.43,0.51,0.54,1),0.72,0.28),
 'MET_SENSORS':((0.88,0.91,0.91,1),0.15,0.48),
 'MET_ACCENT':((0.025,0.34,0.60,1),0.25,0.38),
}
G=defaultdict(lambda:{'v':[],'f':[]})
def add(mat,verts,faces):
 g=G[mat]; start=len(g['v']);g['v'].extend(verts);g['f'].extend(tuple(start+i for i in f) for f in faces)
def box(mat,c,s, bevel=False):
 x,y,z=c; a,b,d=[v/2 for v in s]
 v=[(x-a,y-b,z-d),(x+a,y-b,z-d),(x+a,y+b,z-d),(x-a,y+b,z-d),(x-a,y-b,z+d),(x+a,y-b,z+d),(x+a,y+b,z+d),(x-a,y+b,z+d)]
 f=[(0,2,1),(0,3,2),(4,5,6),(4,6,7),(0,1,5),(0,5,4),(3,7,6),(3,6,2),(0,4,7),(0,7,3),(1,2,6),(1,6,5)]
 add(mat,v,f)
def tube(mat,p,q,r,segments=12,r2=None):
 p=tuple(p);q=tuple(q);dx=[q[i]-p[i] for i in range(3)]; L=math.sqrt(sum(t*t for t in dx));u=[t/L for t in dx];ref=(0,1,0) if abs(u[1])<.9 else (1,0,0)
 a=[u[1]*ref[2]-u[2]*ref[1],u[2]*ref[0]-u[0]*ref[2],u[0]*ref[1]-u[1]*ref[0]];al=math.sqrt(sum(t*t for t in a));a=[t/al for t in a]
 b=[u[1]*a[2]-u[2]*a[1],u[2]*a[0]-u[0]*a[2],u[0]*a[1]-u[1]*a[0]]
 r2=r if r2 is None else r2
 v=[]
 for center,rad in ((p,r),(q,r2)):
  for i in range(segments):
   theta=2*math.pi*i/segments; v.append(tuple(center[k]+rad*(math.cos(theta)*a[k]+math.sin(theta)*b[k]) for k in range(3)))
 v.extend([p,q]);f=[]
 for i in range(segments):
  j=(i+1)%segments;f.extend([(i,j,segments+j),(i,segments+j,segments+i),(2*segments,j,i),(2*segments+1,segments+i,segments+j)])
 add(mat,v,f)
def ball(mat,c,r,lat=5,lon=10):
 v=[(c[0],c[1]+r,c[2])]
 for i in range(1,lat):
  t=math.pi*i/lat
  for j in range(lon):
   p=j*2*math.pi/lon;v.append((c[0]+r*math.sin(t)*math.cos(p),c[1]+r*math.cos(t),c[2]+r*math.sin(t)*math.sin(p)))
 v.append((c[0],c[1]-r,c[2]));f=[]
 for j in range(lon):f.append((0,1+(j+1)%lon,1+j))
 for i in range(lat-2):
  for j in range(lon):
   a=1+i*lon+j;b=1+i*lon+(j+1)%lon;cc=a+lon;d=b+lon;f.extend([(a,b,d),(a,d,cc)])
 last=len(v)-1
 for j in range(lon):f.append((last,1+(lat-2)*lon+j,1+(lat-2)*lon+(j+1)%lon))
 add(mat,v,f)
# footprint, plinth and galvanized vertical mast
box('MET_MAST',(0,.055,0),(.70,.11,.70))
for x in (-.255,.255):
 for z in (-.255,.255):
  box('MET_MAST',(x,.122,z),(.085,.025,.085))
tube('MET_MAST',(0,.11,0),(0,4.28,0),.048,12)
for side in (-1,1):
 tube('MET_MAST',(side*.255,.15,0),(0,1.10,0),.023,8)
 tube('MET_MAST',(side*.255,.15,0),(0,.85,side*.18),.017,8)
# shaft collars
for y in (.40,2.15,3.65): tube('MET_MAST',(0,y-.035,0),(0,y+.035,0),.062,12)
# crossarm x, brackets and capped tips
tube('MET_MAST',(-.83,3.71,0),(.83,3.71,0),.025,10)
tube('MET_MAST',(-.39,3.69,0),(0,3.43,0),.017,8)
tube('MET_MAST',(.39,3.69,0),(0,3.43,0),.017,8)
for x in (-.83,.83):tube('MET_MAST',(x,3.71,0),(x,3.77,0),.034,10)
# telemetry/data box mounted in mast foreground +Z
box('MET_SENSORS',(.11,1.84,.12),(.34,.47,.16))
box('MET_ACCENT',(.11,1.87,.205),(.18,.035,.006))
tube('MET_MAST',(0,2.07,.06),(.11,2.07,.12),.019,8)
# cup anemometer with visible static 3 cups (not separately animatable)
tube('MET_MAST',(-.68,3.75,0),(-.68,4.33,0),.022,10)
tube('MET_SENSORS',(-.68,4.28,0),(-.68,4.38,0),.053,12)
tube('MET_MAST',(-.68,4.38,0),(-.68,4.5,0),.014,8)
for k in range(3):
 ang=2*math.pi*k/3; px=-.68+.19*math.cos(ang);pz=.19*math.sin(ang)
 tube('MET_MAST',(-.68,4.34,0),(px,4.34,pz),.014,8)
 ball('MET_SENSORS',(px,4.34,pz),.062,4,8)
# wind vane at right side; triangular flag
# vane shared same mount but separate from rotor as static geometry
tube('MET_MAST',(.68,3.75,0),(.68,4.27,0),.021,10)
tube('MET_SENSORS',(.68,4.26,-.23),(.68,4.26,.25),.015,8)
add('MET_ACCENT',[(.68,4.25,-.14),(.68,4.43,-.40),(.68,4.25,-.40),(.68,4.25,-.14)],[(0,1,2),(0,2,3)]) # flat fin, one plane
# tapered arrow nose via cones
tube('MET_SENSORS',(.68,4.26,.22),(.68,4.26,.33),.048,8,r2=.006)
# irradiance sensor bowl with white enclosure and blue dome
# mounted on front offset +Z
tube('MET_MAST',(.14,3.70,.03),(.14,3.98,.24),.017,8)
tube('MET_SENSORS',(.14,3.95,.24),(.14,4.02,.24),.085,16,r2=.068)
ball('MET_ACCENT',(.14,4.037,.24),.059,5,12)
# air temp radiation shield: stacked ceramic-white circular plates
# mounted on right/front to remain visible in orbit
x=.73;z=.19
tube('MET_MAST',(.48,3.25,0),(x,3.25,z),.017,8)
tube('MET_MAST',(x,2.93,z),(x,3.48,z),.013,8)
for y in [3.00,3.075,3.15,3.225,3.30,3.375]:
 tube('MET_SENSORS',(x,y,z),(x,y+.023,z),.092,12,r2=.077)
box('MET_SENSORS',(x,3.41,z),(.13,.05,.13))
# cable path only local, no attached network
tube('MET_MAST',(.11,1.59,.08),(.11,.65,.08),.013,8)
ANCHORS={'ANCHOR_LABEL':[0,4.72,0],'ANCHOR_STATUS':[.18,2.15,.22],'ANCHOR_IRRADIANCE':[.14,4.075,.24],'ANCHOR_WIND':[-.68,4.34,0]}

def export_blender():
 import bpy
 from mathutils import Matrix
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 for name,(rgba,metal,rough) in COLORS.items():
  mat=bpy.data.materials.new(name);mat.diffuse_color=rgba;mat.use_nodes=True
  bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=rgba;bsdf.inputs['Metallic'].default_value=metal;bsdf.inputs['Roughness'].default_value=rough
  g=G[name];mesh=bpy.data.meshes.new(name);mesh.from_pydata(g['v'],[],g['f']);mesh.update()
  ob=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(ob);ob.data.materials.append(mat)
  # exporter converts Blender Z up to glTF Y up; Blender geometry mapped from glTF XYZ -> Blender (X,-Z,Y)
  ob.matrix_world=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
 root=bpy.data.objects.new('ROOT',None);bpy.context.collection.objects.link(root)
 for key,pos in ANCHORS.items():
  empty=bpy.data.objects.new(key,None);bpy.context.collection.objects.link(empty)
  empty.parent=root;empty.location=(pos[0],-pos[2],pos[1])
 # meshes must be parented while preserving world transform
 for name in COLORS:
  ob=bpy.data.objects[name];matrix=ob.matrix_world.copy();ob.parent=root;ob.matrix_world=matrix
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'weather-station.glb'),export_format='GLB',export_yup=True,export_apply=False,export_cameras=False,export_lights=False)
 print('Blender export complete: weather-station.glb')

def export_local():
 import trimesh,numpy as np
 from trimesh.visual.material import PBRMaterial
 scene=trimesh.Scene(base_frame='ROOT')
 for name, (rgba,metal,rough) in COLORS.items():
  g=G[name]; m=trimesh.Trimesh(vertices=np.array(g['v']),faces=np.array(g['f']),process=False)
  rgb=tuple(round(v*255) for v in rgba)
  m.visual=trimesh.visual.TextureVisuals(material=PBRMaterial(name=name,baseColorFactor=rgb,metallicFactor=metal,roughnessFactor=rough,doubleSided=False))
  scene.add_geometry(m,node_name=name,geom_name=name,parent_node_name='ROOT')
 for k,v in ANCHORS.items():
  mat=np.eye(4);mat[:3,3]=v;scene.graph.update(frame_to=k,frame_from='ROOT',matrix=mat)
 data=scene.export(file_type='glb');open(os.path.join(OUT,'weather-station.glb'),'wb').write(data)
 return scene
if __name__=='__main__':
 try: import bpy
 except ImportError: export_local()
 else: export_blender()
