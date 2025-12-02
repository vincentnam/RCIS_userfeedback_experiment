import ast
import operator
import xml.etree.ElementTree as ET
import sys

root = ET.parse("metadata.xml").getroot()
aux_key = ("MD_Metadata.identificationInfo.MD_DataIdentification.extent.EX_Extent."
           "geographicElement.EX_GeographicBoundingBox.southBoundLatitude.Decimal.@value").replace("@", "")


def walk_tree(key, root, operator, operand):
    bool = False
    if len(key.split(".")) > 1:
        aux = key.split(".")[1:]
    else:
        aux = key
    for i in root:

        if aux[0] in i.tag:

            if len(key.split(".")) == 3:
                print(i.text, file=sys.stderr)
                print(i)
                if operator(ast.literal_eval(i.text), operand):
                    return True
                else:
                    return False

            bool = walk_tree(".".join(aux), i, operator, operand)
    if bool:
        return root
    else:
        return []

print(walk_tree(aux_key,root, operator.le,-1000 ))

print(eval("operator.le"))

# try:
#
#     print("str(ET.tostring(walk_tree(aux_key, root, operator_list_def(operator), operand)).decode('utf-8'))",
#           file=sys.stderr)
#     print(walk_tree(aux_key, root, operator_list_def(operator), operand), file=sys.stderr)
#     return str(ET.tostring(walk_tree(aux_key, root, operator_list_def(operator), operand)).decode("utf-8"))
# except:
#     print("Ton gros derrière là", file=sys.stderr)
#     return ''