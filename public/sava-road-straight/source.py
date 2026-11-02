# Blender 4.2+ standalone script. Run: blender -b -t 2 --python source.py
# Geometry source original procedural primitives, commercial reuse permitted.
import bpy, json, math, os
from mathutils import Vector
DATA=json.loads(r'''{"ROAD_WARM":{"vertices":[[-2.5,0.0,-1.5],[-2.5,0.0,1.5],[-2.5,0.07,-1.5],[-2.5,0.07,1.5],[2.5,0.0,-1.5],[2.5,0.0,1.5],[2.5,0.07,-1.5],[2.5,0.07,1.5]],"faces":[[1,3,0],[4,1,0],[0,3,2],[2,4,0],[1,7,3],[5,1,4],[5,7,1],[3,7,2],[6,4,2],[2,7,6],[6,5,4],[7,5,6]]}}''')
ANCHORS=json.loads(r'''{"ANCHOR_START": [-2.5, 0.07, 0], "ANCHOR_END": [2.5, 0.07, 0]}''')
MAT_DATA=json.loads(r'''{"ROAD_WARM": [[0.67, 0.64, 0.56, 1], 0, 0.92]}''')
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
root=bpy.data.objects.new('ROOT',None); bpy.context.collection.objects.link(root)
for name,d in DATA.items():
    # Blender coordinate (x,-z,y) exports glTF Y-up -> (x,y,z)
    v=[(x,-z,y) for x,y,z in d['vertices']]
    f=[tuple(face) for face in d['faces']]
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(v,[],f); mesh.update()
    ob=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(ob);ob.parent=root
    mat=bpy.data.materials.new(name);mat.use_nodes=True
    p=mat.node_tree.nodes.get('Principled BSDF')
    rgb,metal,rough=MAT_DATA[name]
    p.inputs['Base Color'].default_value=tuple(rgb);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    ob.data.materials.append(mat)
for name,(x,y,z) in ANCHORS.items():
    ob=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(ob);ob.parent=root;ob.location=(x,-z,y)
folder=os.path.dirname(os.path.abspath(__file__))
bpy.ops.export_scene.gltf(filepath=os.path.join(folder,'road-straight.glb'),export_format='GLB',export_yup=True,export_apply=True,export_cameras=False,export_lights=False)
print('Exported GLB; validate exported output independently')
