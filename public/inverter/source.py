"""Blender 4.2 LTS+ standalone asset reconstruction.
Usage: blender --background --python source.py
Keep geometry_recipe.json adjacent to this script. No add-ons / internet needed.
Coordinates in recipe/GLB: X right, Y up, Z front.
Blender coordinates use X right, Z up, -Y front; Blender exporter maps to glTF +Y up.
"""
import bpy, math, json, os
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(HERE, 'geometry_recipe.json'), encoding='utf-8') as f:
    recipe = json.load(f)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
scene.unit_settings.scale_length=1

def to_blender(v): return (v[0], -v[2], v[1])
materials={}
for name, data in recipe['materials'].items():
    m=bpy.data.materials.new(name)
    m.use_nodes=True
    bsdf=m.node_tree.nodes.get('Principled BSDF')
    rgba=data['baseColorFactor']
    bsdf.inputs['Base Color'].default_value=(*rgba[:3],1)
    bsdf.inputs['Metallic'].default_value=data['metallicFactor']
    bsdf.inputs['Roughness'].default_value=data['roughnessFactor']
    if data.get('emissiveFactor'):
        bsdf.inputs['Emission Color'].default_value=(*data['emissiveFactor'],1)
        bsdf.inputs['Emission Strength'].default_value=1
    materials[name]=m
root=bpy.data.objects.new('ROOT',None)
scene.collection.objects.link(root)
for group in recipe['materials']:
    components=[]
    for spec in recipe['parts']:
        if spec['group']!=group: continue
        if spec['kind']=='box':
            bpy.ops.mesh.primitive_cube_add(size=1)
            ob=bpy.context.object
            sx,sy,sz=spec['size']
            ob.dimensions=(sx,sz,sy)
        else:
            bpy.ops.mesh.primitive_cylinder_add(vertices=spec['sections'],radius=spec['radius'],depth=spec['height'])
            ob=bpy.context.object
            if spec['axis']=='Z': ob.rotation_euler[0]=math.pi/2
            if spec['axis']=='X': ob.rotation_euler[1]=math.pi/2
        ob.name=spec['name']
        ob.location=to_blender(spec['center'])
        bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
        ob.data.materials.append(materials[group])
        components.append(ob)
    bpy.ops.object.select_all(action='DESELECT')
    for ob in components: ob.select_set(True)
    bpy.context.view_layer.objects.active=components[0]
    bpy.ops.object.join()
    combined=bpy.context.object
    combined.name=group
    combined.data.name=group
    combined.parent=root
    # retain positions already baked into source geometry via join
for name,v in recipe['anchors'].items():
    empty=bpy.data.objects.new(name,None)
    empty.empty_display_type='PLAIN_AXES'
    scene.collection.objects.link(empty)
    empty.parent=root
    empty.location=to_blender(v)
bpy.ops.object.select_all(action='DESELECT')
for ob in scene.objects:
    if ob.name=='ROOT' or ob.parent==root: ob.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=os.path.join(HERE,'inverter.blender-export.glb'),export_format='GLB',export_yup=True,export_selected=True,export_apply=True,export_materials='EXPORT')
print('Blender reconstruction exported. Please validate resulting GLB independently.')
