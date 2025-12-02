import pickle
import json
import os
from pymongo import MongoClient

import numpy as np
import pandas as pd
from pymongo import MongoClient
import json
import os

from lxml import etree
import dateparser

import re
import datetime


# TODO : Format date to interrop doc

def get_all_keys(doc, main_key=None, separator=".", key_list = [], first_call=True):
    '''
    Get all key and sub key of a document, sub key are constructed with a separator defined as a parameter.
    :param doc:
    :param main_key:
    :param separator:
    :param first_call
    :return:
    '''
    if isinstance(doc, type({})):

        for key in  doc.keys():
            if main_key is None :
                key_list.append(key)
                get_all_keys(doc[key],main_key=key, separator=separator, key_list=key_list, first_call=False)
            else :
                key_list.append(main_key+separator+key)
                get_all_keys(doc[key],main_key=main_key+separator+key, separator=separator, key_list=key_list, first_call=False)
    if isinstance(doc, type([])):
        for obj in doc:
            if isinstance(obj, type({})):
                for key in  obj.keys():
                    if main_key is None :
                        key_list.append(key)
                        get_all_keys(obj[key],main_key=key, separator=separator, key_list=key_list, first_call=False)
                    else :
                        key_list.append(main_key+separator+key)
                        get_all_keys(obj[key],main_key=main_key+separator+key, separator=separator, key_list=key_list, first_call=False)

    return key_list


def remove_id_in_json(f_json):
    """
    As mongoDB id or _id is reserved keyword, this function modify any field that is "id" or "_id" to add "doc" before.
    :param f_json: dict containing a parsed json
    :return: dict : f_json with a modified "id" or "_id" key if there was
    """
    key_list = ["id","_id"]
    if index_key_list:=[index for index, key_is_present in enumerate([key in f_json for key in key_list ]) if key_is_present]:
        for index in index_key_list :
            f_json["doc_"+ key_list[index]]= f_json.pop( key_list[index])
    return f_json

def format_date_json(doc):
    if type(doc) is dict:
        for key in doc.keys():
            if (type(doc[key]) is str) and (date := dateparser.parse(doc[key])) is not None:
                    doc[key]=date
            format_date_json(doc[key])
    if type(doc) is list:
        for object in doc :
            format_date_json(object)

    return doc


def read_preprocess_insert_in_mongodb_json(fp, mongodb_coll=None, fp_is_dict=False):
    """
    Read, remove any incompatible "id" key and insert the JSON in a collection in a mongodb database
    :param fp: str : file_path to a JSON to read
    :param mongodb_coll: MongoClient.database.collection : A collection in which insert files
    :return: None
    """
    if mongodb_coll is None:
        mongodb_coll = MongoClient("localhost:27017").no_model_name.interop_metadata
        print("coucou")
    try:
        # mongodb_coll.insert_one(format_date_json(remove_id_in_json(json.load(open(fp)))))
        # Error seens in data formatting
        if fp_is_dict:
            mongodb_coll.insert_one((remove_id_in_json(fp)))
        else:
            mongodb_coll.insert_one((remove_id_in_json(json.load(open(fp)))))
        # print(fp + " has been inserted successfully.")
    except Exception as exce :
        print("Insertion has not been successfully done. Logs : " + str(exce))

def dont_contains_dict(liste):
    for elem in liste :
        # print(elem)
        if type(elem) is dict:
            return False
    return True


# Transform a date to standard format
def format_date(date):
    # Transform a string date into a standard format by trying each
    # date format. If you want to add a format, add a try/except in the
    # last except
    # date : str : the date to transform
    # return : m : timedata : format is YYYY-MM-DD HH:MM:SS
    date_str = date
    #
    date_str = date_str.replace("st","").replace("th","")\
        .replace("nd","").replace("rd","").replace(" Augu "," Aug ")
    m = None
    sep_list = [".","/","-","_"," ",":"]
    for date_sep in sep_list:
        try:
            m = datetime.datetime.strptime(date_str, "%d"+date_sep+"%B"+date_sep+"%Y")
            break
        except ValueError:
            try:
                m = datetime.datetime.strptime(date_str, "%d"+date_sep+"%b"+date_sep+"%Y")
                break
            except ValueError:
                try:
                    m = datetime.datetime.strptime(date_str, "%Y"+date_sep+"%m"+date_sep+"%d")
                    break
                except ValueError:
                    try :
                        m = datetime.datetime.strptime(date_str,
                                                   "%d"+date_sep+"%m"+date_sep+"%Y")
                        break
                    except ValueError:
                        for hour_sep in sep_list:
                            try:
                                m = datetime.datetime\
                                    .strptime(date_str,"%d"+date_sep+"%m"+date_sep+"%Y %H"+hour_sep+"%M"+hour_sep+"%S")
                                break
                            except ValueError:
                                try:
                                    m = datetime.datetime\
                                        .strptime(date_str, "%Y"+date_sep+"%m"+date_sep+"%d %H"+hour_sep+"%M"+hour_sep+"%S")
                                    break
                                except ValueError:
                                    # HERE ADD A FORMAT TO CHECK
                                    # print("Format not recognised. \nConsider "
                                    #       "adding a date format "
                                    #       "in the function \"format_date\".")
                                    pass

    return m

def XML_to_dict(xml):
    xml_tag = re.sub("{.*}","",xml.tag)
    res_dict ={xml_tag:{}}
    path = [xml_tag]
    def tree_walk(xml, path):
        aux_path = path
        for child in xml.getchildren():
            child_tag=re.sub("{.*}","",child.tag)
            aux = res_dict
            for i in path:
                aux = aux[i]
            if child_tag in aux:
                for attr in child.attrib:

                    if re.sub("{.*}","",attr) in aux[child_tag]:

                        if isinstance(aux[child_tag][re.sub("{.*}","",attr)], list):
                            aux[child_tag][re.sub("{.*}","",attr)].append(child.attrib[attr])
                        else :
                            aux[child_tag][re.sub("{.*}","",attr)] = [aux[child_tag][re.sub("{.*}","",attr)]] + [child.attrib[attr]]
                    else :
                        aux[child_tag][re.sub("{.*}","",attr)] = child.attrib[attr]
                if isinstance(child.text,str):
                    if child.text.strip():
                        if "@value" in aux[child_tag]:
                            if isinstance(aux[child_tag]["@value"],list):

                                        aux[child_tag]["@value"].append(child.text)
                            else:
                                aux[child_tag]["@value"]=[aux[child_tag]["@value"]]+[child.text]
                        else:
                            aux[child_tag]["@value"]=child.text
            else:
                aux[child_tag]={}
                for attr in child.attrib:
                    aux[child_tag][re.sub("{.*}","",attr)]=child.attrib[attr]
                if isinstance(child.text,str):
                    if child.text.strip():
                        aux[child_tag]["@value"]=child.text
            tree_walk(child, aux_path+[child_tag])
    for child in xml.getchildren():
        child_tag=re.sub("{.*}","",child.tag)
        if child_tag in res_dict[xml_tag]:
            for attr in child.attrib:
                if re.sub("{.*}","",attr) in res_dict[xml_tag][child_tag]:
                    if isinstance(res_dict[xml_tag][child_tag][re.sub("{.*}","",attr)], list):
                        res_dict[xml_tag][child_tag][re.sub("{.*}","",attr)].append(child.attrib[attr])
                    else:
                        res_dict[xml_tag][child_tag][re.sub("{.*}","",attr)] = [res_dict[xml_tag][child_tag][re.sub("{.*}","",attr)]] + [child.attrib[attr]]
                else:
                    res_dict[xml_tag][child_tag][re.sub("{.*}","",attr)]=child.attrib[attr]
            if isinstance(child.text,str):
                if child.text.strip():
                    if "@value" in res_dict[xml_tag][child_tag]:
                        if isinstance(res_dict[xml_tag][child_tag]["@value"],list):
                                    res_dict[xml_tag][child_tag]["@value"].append(child.text)
                        else:
                            res_dict[xml_tag][child_tag]["@value"]=[res_dict[xml_tag][child_tag]["@value"]]+[child.text]
                    else:
                        res_dict[xml_tag][child_tag]["@value"]=child.text
        else:
            res_dict[xml_tag][child_tag]={}
            for attr in child.attrib:
                res_dict[xml_tag][child_tag][re.sub("{.*}","",attr)]=child.attrib[attr]
            if isinstance(child.text,str):
                if child.text.strip():
                    if "@value" in res_dict[xml_tag][child_tag]:
                        if isinstance(res_dict[xml_tag][child_tag]["@value"],list):
                            res_dict[xml_tag][child_tag]["@value"].append(child.text.strip())
                        else:
                            res_dict[xml_tag][child_tag]["@value"]=res_dict[xml_tag][child_tag]["@value"]+[child.text]

                    else:
                        res_dict[xml_tag][child_tag]["@value"]=child.text
        tree_walk(child, path+[child_tag])
    return res_dict


def from_keyset_to_csv(key_set, separator="."):
    color = {"0":"#F3722C","1":"#F8961E","2":"#F9C74F","3":"#90BE6D", "4":"#43AA8B","5":"#4D908E","6":"#577590","7":"#277DA1", "8":"#bdd5ea", "9":"#e3e2e3","10":"#ffffff", "11":"#ffffff"}
    csv_list = [("ROOT_NODE","",-1,"#F94144")]
    for key_concat in key_set:
        key_split = key_concat.split(separator)
        for index in range(len(key_split)):
            if index <9:
                if len(key_split)==1:
                    csv_list.append((separator.join(key_split[:index+1]),"ROOT_NODE", index, color[str(index)]))
                    break
                if index == len(key_split) -1:
                    break
                csv_list.append((separator.join(key_split[:index+2]),separator.join(key_split[:index+1]),index+1, color[str(index+1)]))

            else :
                if index == len(key_split) -1:
                    break
                csv_list.append((separator.join(key_split[:index+2]),separator.join(key_split[:index+1]),index+1,"#ffffff"))
    return (["key","mother_key", "level","color"],set(csv_list))

# Run BEFORE usage of network
registry = json.loads(open("registry.json","r", encoding="utf8").read())

with open("registry_ODATIS.dict", "wb") as fp:
    pickle.dump(registry,fp)
with open("registry_AERIS.dict", "wb") as fp:
    pickle.dump(registry,fp)
with open("registry_FHIR.dict", "wb") as fp:
    pickle.dump(registry,fp)

operator_list_mongo = {
    "equal":"$eq",
    "lower or equal":"$lte",
    "greater or equal":"$gte",
    "greater than":"$gt",
    "in":"$in",
    "lower than":"$lt",
    "not equal":"$ne",
    "not in":"$nin"
}

operator_list_sql= {
    "equal":"=",
    "lower or equal":"<=",
    "greater or equal":">=",
    "greater than":">",
    "in":"LIKE",
    "lower than":"<",
    "not equal":"!=",
    "not in":"NOT LIKE"
}
operator_list_xml = {
    "equal":"operator.eq",
    "lower or equal":"operator.le",
    "greater or equal":"operator.ge",
    "greater than":"operator.gt",
    "lower than":"operator.lt",
    "not equal":"operator.ne"
}

with open("operator_list_mongo.dict", "wb") as fp:
    pickle.dump(operator_list_mongo,fp)

with open("operator_list_sql.dict", "wb") as fp:
    pickle.dump(operator_list_sql,fp)

with open("operator_list_xml.dict", "wb") as fp:
    pickle.dump(operator_list_xml,fp)

mongo_client = MongoClient("localhost:27017")
base_path = "../demonstration_files/raw_data/"
model_dict = {}
model_examples_folder = list(os.walk(base_path))[0][1]
print(model_examples_folder)
for model_name in model_examples_folder:
    # print(model_name)
    file_list = []
    mongodb_coll_var = mongo_client[model_name].interop_metadata
    # print(model_name)
    for i in os.walk(base_path + model_name):
        # print(i)
        for j in i[2]:
            # print(j)
            if j.endswith(".json"):
                file_path = os.path.join(i[0], j)
                file_list.append((os.path.join(i[0], j), model_name, "json"))
                read_preprocess_insert_in_mongodb_json(file_path, mongodb_coll=mongodb_coll_var)
                # print(file_path)
            if j.endswith(".xml"):
                try:
                    file_list.append((os.path.join(i[0], j), model_name, "xml"))
                    file = etree.parse(open(os.path.join(i[0], j),encoding="utf8"),
                                       parser=etree.XMLParser(ns_clean=True, remove_comments=True,
                                                              recover=True)).getroot()
                    res = XML_to_dict(file)
                    read_preprocess_insert_in_mongodb_json(res, mongodb_coll=mongodb_coll_var, fp_is_dict=True)
                except Exception as e:
                    print(os.path.join(i[0], j))
                    print(e)
            if j.endswith(".csv"):
                print((os.path.join(i[0], j)))
                if os.path.join(i[0], j) == "../demonstration_files/raw_data/opendatasoft/datasets.csv":
                    csv_data = pd.read_csv(os.path.join(i[0], j), sep=";", on_bad_lines='skip')
                    csv_data.columns = csv_data.columns.map(lambda x: x.replace(".", "#"))
                    # print(get_delimiter("../raw_data/opendatasoft/datasets.csv"))
                    json_data = csv_data.to_json(orient='records')
                    # print(type(json.loads(json_data)))
                    for document in json.loads(json_data):
                        read_preprocess_insert_in_mongodb_json(document, mongodb_coll=mongodb_coll_var, fp_is_dict=True)
                else:
                    csv_data = pd.read_csv(os.path.join(i[0], j), sep=",", on_bad_lines='skip')
                    # print(get_delimiter("../raw_data/opendatasoft/datasets.csv"))
                    json_data = csv_data.to_json(orient='records')
                    # print(type(json.loads(json_data)))
                    for document in json.loads(json_data):
                        read_preprocess_insert_in_mongodb_json(document, mongodb_coll=mongodb_coll_var, fp_is_dict=True)

    model_dict[model_name] = file_list
# Run AFTER the docker compose is up
# mongoclient = MongoClient("localhost:27017")
# for folder in os.listdir("AERIS"):
#     file = json.load(open("AERIS/"+folder+"/"+os.listdir("AERIS/"+folder)[0]))
#     print(os.listdir("AERIS/"+folder))
#     mongoclient.AERIS.interop_metadata.insert_one(file)
#
#



