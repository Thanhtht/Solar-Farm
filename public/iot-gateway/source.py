# Blender 4.2+ (built-in bpy, json, math only). Run: blender -b -P source.py
import bpy, math, json
from pathlib import Path
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.context.scene.unit_settings.system='METRIC'
SPECS = [{'kind': 'box', 'group': 'GW_BODY', 'pos': [0, 0.07, 0], 'size': [1.2, 0.14, 0.8]}, {'kind': 'box', 'group': 'GW_BODY', 'pos': [0, 1.065, -0.035], 'size': [1.1, 1.85, 0.69]}, {'kind': 'box', 'group': 'GW_BODY', 'pos': [0, 1.065, 0.315], 'size': [1.035, 1.75, 0.018]}, {'kind': 'box', 'group': 'GW_ANTENNA', 'pos': [-0.505, 1.07, 0.33], 'size': [0.012, 1.71, 0.005]}, {'kind': 'box', 'group': 'GW_ANTENNA', 'pos': [0.505, 1.07, 0.33], 'size': [0.012, 1.71, 0.005]}, {'kind': 'box', 'group': 'GW_ANTENNA', 'pos': [0, 1.94, 0.33], 'size': [1.02, 0.009, 0.006]}, {'kind': 'box', 'group': 'GW_ANTENNA', 'pos': [0, 0.194, 0.33], 'size': [1.02, 0.009, 0.006]}, {'kind': 'box', 'group': 'GW_ANTENNA', 'pos': [0, 0.285, 0.338], 'size': [0.86, 0.022, 0.01]}, {'kind': 'box', 'group': 'GW_BODY', 'pos': [-0.18, 1.44, 0.34], 'size': [0.4, 0.22, 0.008]}, {'kind': 'box', 'group': 'GW_ANTENNA', 'pos': [0.405, 1.06, 0.36], 'size': [0.028, 0.15, 0.05]}, {'kind': 'box', 'group': 'GW_ANTENNA', 'pos': [0.408, 1.06, 0.383], 'size': [0.024, 0.105, 0.023]}, {'kind': 'box', 'group': 'GW_ANTENNA', 'pos': [0, 1.94, -0.388], 'size': [0.87, 0.015, 0.006]}, {'kind': 'box', 'group': 'GW_ANTENNA', 'pos': [-0.55, 0.63, -0.04], 'size': [0.007, 0.015, 0.32]}, {'kind': 'box', 'group': 'GW_ANTENNA', 'pos': [0.55, 0.63, -0.04], 'size': [0.007, 0.015, 0.32]}, {'kind': 'box', 'group': 'GW_ANTENNA', 'pos': [-0.55, 0.69, -0.04], 'size': [0.007, 0.015, 0.32]}, {'kind': 'box', 'group': 'GW_ANTENNA', 'pos': [0.55, 0.69, -0.04], 'size': [0.007, 0.015, 0.32]}, {'kind': 'box', 'group': 'GW_ANTENNA', 'pos': [-0.55, 0.75, -0.04], 'size': [0.007, 0.015, 0.32]}, {'kind': 'box', 'group': 'GW_ANTENNA', 'pos': [0.55, 0.75, -0.04], 'size': [0.007, 0.015, 0.32]}, {'kind': 'box', 'group': 'GW_ANTENNA', 'pos': [-0.55, 0.81, -0.04], 'size': [0.007, 0.015, 0.32]}, {'kind': 'box', 'group': 'GW_ANTENNA', 'pos': [0.55, 0.81, -0.04], 'size': [0.007, 0.015, 0.32]}, {'kind': 'box', 'group': 'GW_ANTENNA', 'pos': [-0.29, 0.47, 0.343], 'size': [0.39, 0.16, 0.012]}, {'kind': 'cyl', 'group': 'GW_ANTENNA', 'pos': [-0.41, 0.46, 0.361], 'radius': 0.028, 'depth': 0.037, 'axis': 'z', 'sections': 10}, {'kind': 'cyl', 'group': 'GW_ANTENNA', 'pos': [-0.29, 0.46, 0.361], 'radius': 0.028, 'depth': 0.037, 'axis': 'z', 'sections': 10}, {'kind': 'cyl', 'group': 'GW_ANTENNA', 'pos': [-0.17, 0.46, 0.361], 'radius': 0.028, 'depth': 0.037, 'axis': 'z', 'sections': 10}, {'kind': 'cyl', 'group': 'GW_ANTENNA', 'pos': [-0.35, 2.013, -0.05], 'radius': 0.034, 'depth': 0.053, 'axis': 'y', 'sections': 12}, {'kind': 'cyl', 'group': 'GW_ANTENNA', 'pos': [-0.35, 2.108, -0.05], 'radius': 0.019, 'depth': 0.182, 'axis': 'y', 'sections': 12}, {'kind': 'cyl', 'group': 'GW_ANTENNA', 'pos': [-0.35, 2.195, -0.05], 'radius': 0.023, 'depth': 0.009, 'axis': 'y', 'sections': 12}, {'kind': 'cyl', 'group': 'GW_ANTENNA', 'pos': [0.35, 2.013, -0.05], 'radius': 0.034, 'depth': 0.053, 'axis': 'y', 'sections': 12}, {'kind': 'cyl', 'group': 'GW_ANTENNA', 'pos': [0.35, 2.108, -0.05], 'radius': 0.019, 'depth': 0.182, 'axis': 'y', 'sections': 12}, {'kind': 'cyl', 'group': 'GW_ANTENNA', 'pos': [0.35, 2.195, -0.05], 'radius': 0.023, 'depth': 0.009, 'axis': 'y', 'sections': 12}, {'kind': 'cyl', 'group': 'GW_INDICATOR', 'pos': [0.32, 1.62, 0.347], 'radius': 0.036, 'depth': 0.025, 'axis': 'z', 'sections': 16}]
MATERIALS = {'GW_BODY': {'baseColorFactor': [0.835, 0.875, 0.865, 1], 'metallicFactor': 0.26, 'roughnessFactor': 0.46}, 'GW_ANTENNA': {'baseColorFactor': [0.09, 0.3, 0.46, 1], 'metallicFactor': 0.57, 'roughnessFactor': 0.34}, 'GW_INDICATOR': {'baseColorFactor': [0.16, 0.74, 0.85, 1], 'metallicFactor': 0.05, 'roughnessFactor': 0.28, 'emissiveFactor': [0.025, 0.11, 0.14]}}
ANCHORS = {'ANCHOR_LABEL': [0, 2.37, 0], 'ANCHOR_STATUS': [0.32, 1.62, 0.405]}
output=Path(__file__).resolve().parent
objects={k:[] for k in MATERIALS}
for s in SPECS:
    if s['kind']=='box':
        bpy.ops.mesh.primitive_cube_add(size=1,location=(s['pos'][0],-s['pos'][2],s['pos'][1]));o=bpy.context.object
        o.dimensions=(s['size'][0],s['size'][2],s['size'][1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    else:
        bpy.ops.mesh.primitive_cylinder_add(vertices=s['sections'],radius=s['radius'],depth=s['depth'],location=(s['pos'][0],-s['pos'][2],s['pos'][1]));o=bpy.context.object
        if s['axis']=='z':o.rotation_euler[0]=math.pi/2
        if s['axis']=='x':o.rotation_euler[1]=math.pi/2
        bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    objects[s['group']].append(o)
for name,parts in objects.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts:o.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join()
    obj=bpy.context.object;obj.name=name
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    mat=bpy.data.materials.new(name);mat.use_nodes=True
    bs=mat.node_tree.nodes.get('Principled BSDF')
    c=MATERIALS[name]['baseColorFactor'];bs.inputs['Base Color'].default_value=c
    bs.inputs['Metallic'].default_value=MATERIALS[name]['metallicFactor']
    bs.inputs['Roughness'].default_value=MATERIALS[name]['roughnessFactor']
    if name=='GW_INDICATOR':
        bs.inputs['Emission Color'].default_value=(.025,.11,.14,1);bs.inputs['Emission Strength'].default_value=1
    obj.data.materials.append(mat)
root=bpy.data.objects.new('ROOT',None);bpy.context.collection.objects.link(root)
for name in MATERIALS:bpy.data.objects[name].parent=root
for name,p in ANCHORS.items():
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=root;o.location=(p[0],-p[2],p[1])
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(output/'iot-gateway.glb'),export_format='GLB',export_yup=True,export_apply=True,export_lights=False,export_cameras=False)
# For measured glTF metrics, inspect the exported GLB, not this untriangulated Blender scene.
