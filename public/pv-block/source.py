"""SAVA PV display cluster. Blender 4.2 LTS (also intended for Blender 4.3+).
Run: blender --background --python source.py
Uses bpy/mathutils and Python standard library only; creates model.glb and manifest.
Reproduction source not executed in delivery environment because Blender is unavailable.
"""
import bpy, math, json, os, struct
from mathutils import Matrix
from mathutils import Vector
from mathutils import Quaternion
OUT=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for ma in list(bpy.data.materials): bpy.data.materials.remove(ma)

def mat(name, color, metallic, roughness):
    m=bpy.data.materials.new(name);m.diffuse_color=(*[v/255 for v in color],1)
    m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=m.diffuse_color
    p.inputs['Metallic'].default_value=metallic;p.inputs['Roughness'].default_value=roughness
    return m
materials={'PV_CELLS':mat('PV_CELLS',(24,72,115),.02,.39),'PV_FRAME':mat('PV_FRAME',(185,197,206),.72,.34),'PV_SUPPORTS':mat('PV_SUPPORTS',(126,143,155),.7,.53)}
parts={k:[] for k in materials};theta=math.radians(-12);s=math.sin(math.radians(12));c=math.cos(math.radians(12))

def cube(group,xyz,dim,tilt=False,angle_z=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz)
    ob=bpy.context.object;ob.name='tmp_'+group
    ob.dimensions=dim
    # Blender Z-up coordinates: map glTF [x,y,z] to Blender [x,-z,y] via -90 deg X
    ob.rotation_euler=(theta if tilt else 0,0,angle_z)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    parts[group].append(ob)

def tb(group,x,dz,zc,w,d,t,base=.91):
    # Local Blender version uses z as vertical, +y as rear; glTF remapping by export orientation
    # built directly in glTF-like coordinates, then rotate whole scene for Blender export
    cube(group,(x,base+s*dz,zc+c*dz),(w,t,d),tilt=True)

def bx(group,xyz,dim): cube(group,xyz,dim)

for zc in [-4.25,-2.55,-.85,.85,2.55,4.25]:
    for i in range(9):
        x=-4+i
        tb('PV_CELLS',x,0,zc,.957,1.269,.013,base=.94)
        for dx in [-.19,.19]:tb('PV_FRAME',x+dx,0,zc,.004,1.242,.002,base=.949)
    for x in [-4.47,4.47]:tb('PV_FRAME',x,0,zc,.018,1.35,.045,base=.922)
    for i in range(10):tb('PV_FRAME',-4.47+i*(8.94/9),0,zc,.023,1.35,.035,base=.924)
    for dz in [-.668,.668]:tb('PV_FRAME',0,dz,zc,9,.025,.04,base=.925)
    for x in [-3.6,0,3.6]:
        for dz in [-.47,.47]:
            top=.90+s*dz-.035
            bx('PV_SUPPORTS',(x,top/2,zc+c*dz),(.065,top,.065))
    for dz in [-.44,.44]:tb('PV_SUPPORTS',0,dz,zc,8.35,.045,.045,base=.858)
    tb('PV_SUPPORTS',0,.38,zc,8.25,.052,.042,base=.815)
    for x in [-3.6,3.6]:
        for dz in [-.47,.47]:
            top=.90+s*dz-.035
            obloc=(x,top*.75,zc+c*dz)
            bpy.ops.mesh.primitive_cube_add(size=1,location=obloc)
            ob=bpy.context.object;ob.name='tmp_PV_SUPPORTS';ob.dimensions=(.035,math.hypot(.5,top*.5),.035)
            ob.rotation_euler[2]=math.atan2(.5,top*.5)
            bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
            parts['PV_SUPPORTS'].append(ob)
# Merge each material's geometry into exactly one material mesh
for group,obs in parts.items():
    bpy.ops.object.select_all(action='DESELECT')
    for ob in obs:ob.select_set(True)
    bpy.context.view_layer.objects.active=obs[0]
    bpy.ops.object.convert(target='MESH')
    bpy.ops.object.join()
    joined=bpy.context.object;joined.name=group
    joined.data.materials.clear();joined.data.materials.append(materials[group]);joined.data.name=group
    # use existing local transforms; explicitly apply object xforms
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
# glTF exporter assumes Blender +Z up and maps to +Y. Rotate coordinates by +90 X in Blender
# Blender (x, -z_glTF, y_glTF) -> glTF (x,y,z). Rotation here applied to mesh coordinates.
rot=Matrix.Rotation(math.radians(90),4,'X')
for group in parts:
    ob=bpy.data.objects[group];ob.data.transform(rot)
    ob.data.update()
# Empty nodes use coordinates in Blender's +Z up system
for name,xyz in {'ANCHOR_LABEL':[0,2,0],'ANCHOR_STATUS':[4,1.8,4]}.items():
    ob=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(ob)
    ob.empty_display_type='PLAIN_AXES';ob.empty_display_size=.12
    ob.location=(xyz[0],-xyz[2],xyz[1])
# The glTF exporter uses export_yup=True, converting Blender Z-up back to glTF Y-up.
# Output GLB only root-level objects with zero parent transforms.
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'pv-block.glb'),export_format='GLB',export_yup=True,
    export_apply=True,export_cameras=False,export_lights=False,export_normals=True,
    export_materials='EXPORT',export_texcoords=True,export_animations=False)
# Manifest computed from Blender scene (exported-file verification should be performed independently)
obj=[bpy.data.objects[n] for n in parts]
pts=[ob.matrix_world@v.co for ob in obj for v in ob.data.vertices]
# points are Blender coordinates, convert back to GLB xyz
coords=[(v.x,v.z,-v.y) for v in pts]
mn=[min(v[i] for v in coords) for i in range(3)];mx=[max(v[i] for v in coords) for i in range(3)]
report={'asset':'pv-block.glb','dimensions_xyz_m':[mx[i]-mn[i] for i in range(3)],'bounds':{'min_xyz':mn,'max_xyz':mx},
 'triangle_count':sum(len(ob.data.polygons)*2 for ob in obj),'primitives':3,
 'materials':list(materials),'anchors':{'ANCHOR_LABEL':[0,2,0],'ANCHOR_STATUS':[4,1.8,4]},
 'file_bytes':os.path.getsize(os.path.join(OUT,'pv-block.glb')),
 'provenance':'Original procedural geometry and PBR colors. No external textures.'}
with open(os.path.join(OUT,'asset_manifest_blender.json'),'w') as f:json.dump(report,f,indent=2)
print('Exported:',report)
