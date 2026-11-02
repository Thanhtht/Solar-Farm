# Run with Blender 4.2+ : blender -b -P source.py -- --name tree-a
# Uses built-in Blender Python modules only. Reads the included geometry_recipe.json.
import bpy, json, os, sys
from pathlib import Path
base=Path(__file__).resolve().parent
recipe=json.loads((base/'geometry_recipe.json').read_text(encoding='utf-8'))
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for entry in recipe['meshes']:
    mesh=bpy.data.meshes.new(entry['name']); mesh.from_pydata([(v[0],-v[2],v[1]) for v in entry['vertices']],[],entry['faces']);mesh.update()
    obj=bpy.data.objects.new(entry['name'],mesh);bpy.context.collection.objects.link(obj)
    mat=bpy.data.materials.new(entry['name']);mat.use_nodes=True
    bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=tuple(entry['rgba']);bs.inputs['Metallic'].default_value=0;bs.inputs['Roughness'].default_value=.94
    mesh.materials.append(mat)
root=bpy.data.objects.new('ROOT',None);bpy.context.collection.objects.link(root)
for obj in list(bpy.context.scene.objects):
    if obj.type=='MESH':obj.parent=root
bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1.0
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:obj.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=str(base/recipe['name']+'.glb'),export_format='GLB',export_yup=True,export_apply=True,export_materials='EXPORT',export_selected=False)
print('Exported',recipe['name']+'.glb')
