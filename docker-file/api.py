import ast
import datetime
import json
import math
import os
import pickle
import sys
import operator
import time

import flask
import pymongo
import requests as req
from bson import json_util
from flask import Flask, make_response
from flask import request
from flask_cors import CORS
import datetime


#### Custom gateway to data management system
import json
import pprint

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})

app.config["PLATFORM-ID"] = os.environ["PLATFORM-ID"]
app.config["REQUEST-ID-LIST"] = []
app.config["COLLECTION"] = os.environ["COLLECTION"]
app.config["MODEL"] = os.environ["MODEL"]

# pprint.pprint(app.config, stream=sys.stderr)
if app.config["PLATFORM-ID"] == "1":
    app.config["registry"] = pickle.loads(open("registry_ODATIS.dict", "rb").read())

if app.config["PLATFORM-ID"] != "1" and app.config["PLATFORM-ID"] != "3":
    app.config["registry"] = pickle.loads(open("registry_AERIS.dict", "rb").read())

if app.config["PLATFORM-ID"] == "3":
    app.config["registry"] = pickle.loads(open("registry_FHIR.dict", "rb").read())

# pprint.pprint(app.config["registry"],stream=sys.stderr)

# print(app.config["registry"],file=sys.stderr)
app.config["REGISTRY-VERSION"] = app.config["registry"]["registry-version"]


# @app.route("/data")
# def hello_world():
#     return
@app.route("/platform_id", methods=['PUT'])
def modify_platform_id():
    app.config["PLATFORM-ID"] = request.headers["platform-id"]
    rep = flask.Response(status=204)
    rep.set_data(app.config["PLATFORM-ID"])
    return rep


@app.route("/test_registry")
def update_state_registry():
    # pprint.pprint(app.config["registry"]["platforms"], stream=sys.stderr)
    # TODO :UPDATE NETWORK
    # TODO :UPDATE MODELS PART
    print(app.config["registry"]["platforms"], file=sys.stderr)
    for id_plat in app.config["registry"]["platforms"]:
        # print(id_plat, file=sys.stderr)
        for link in app.config["registry"]["platforms"][id_plat]["links"]:
            if id_plat not in app.config["registry"]["platforms"][link]["links"]:
                app.config["registry"]["platforms"][link]["links"].append(id_plat)
    # distrib[0] = 2-degree nodes
    new_degree_distrib_list = [[], []]
    for id_plat in app.config["registry"]["platforms"]:
        # if (len(app.config["registry"]["platforms"][id_plat]["links"])-2+1)>len(new_degree_distrib_list):
        # -2 because first degree = 2; +1 because it is needed to have a empty list for k_max+1
        while (len(app.config["registry"]["platforms"][id_plat]["links"])) > len(new_degree_distrib_list):
            new_degree_distrib_list.append([])
        new_degree_distrib_list[len(app.config["registry"]["platforms"][id_plat]["links"]) - 2].append(id_plat)
    app.config["registry"]["network"]["degrees_distribution"] = new_degree_distrib_list
    app.config["registry"]["network"]["node_number"] = len(app.config["registry"]["platforms"].keys())

    # app.config["registry"]["platforms"]
    # pprint.pprint('app.config["registry"]["platforms"]', stream=sys.stderr)

    # pprint.pprint(app.config["registry"]["platforms"], stream=sys.stderr)
    # return "ok"


@app.route('/registry', methods=['POST'])
def overwrite_registry():
    # pprint.pprint(request, stream=sys.stderr)

    pprint.pprint(request.headers, stream=sys.stderr)

    pprint.pprint(request.get_json(), stream=sys.stderr)
    if request.headers["registry-version"] == app.config["REGISTRY-VERSION"]:
        return flask.Response(status=208)
    else:
        app.config["REGISTRY-VERSION"] = request.headers["registry-version"]
    data = request.get_json(force=True)
    with open("registry.dict", "wb") as fp:
        pickle.dump((data), fp)
        if "only-matches" in request.headers and "matchs" in data:
            app.config["registry"]["matchs"]={**app.config["registry"]["matchs"], **data["matchs"]}
            update_state_registry()
        else:
            for key in app.config["registry"]:
                if key != "registry-version" and key != "network" and key != "models":
                    # pprint.pprint("KEY",stream=sys.stderr)
                    # pprint.pprint(key,stream=sys.stderr)
                    # pprint.pprint(data[key],stream=sys.stderr)
                    app.config["registry"][key] = {**app.config["registry"][key], **data[key]}
                    # UPDATE LE REGISTRY AVEC LES LINKS

                    update_state_registry()
    print(data, file=sys.stderr)
    if "models" in data:
        for key in data["models"]:
            if key in app.config["registry"]["models"]:
                app.config["registry"]["models"][key]["platforms"].append(data["platform"])
            else:
                app.config["registry"]["models"] = {**app.config["registry"]["models"], **data["models"]}
    aux_header = dict(request.headers)

    aux_header["Platform-Visited"] = aux_header["Platforms-Visited"] + "," + app.config["PLATFORM-ID"]
    #     pprint.pprint("COUCOU", stream=sys.stderr)
    #     pprint.pprint(app.config["registry"], stream=sys.stderr)

    # pprint.pprint(app.config["registry"]["platforms"])

    for platform_id in app.config["registry"]["platforms"][app.config["PLATFORM-ID"]]["links"]:
        if platform_id not in request.headers["platforms-visited"] and platform_id != request.headers["platform-id"]:
            req.post(app.config["registry"]["platforms"][platform_id]["URL"][0] + "/registry", headers=aux_header,
                     data=json.dumps(data), timeout=5)
    #             pass
    return flask.Response({}, status=204)


@app.route('/registry', methods=['GET'])
def get_registry():
    #     print(flask.jsonify(open("registry.dict", "r").read()))
    #     return flask.jsonify(open("registry.dict", "r").read())
    #     response =  flask.Response(status=200)
    #     response.set_data(flask.jsonify(app.config["registry"]))
    response = flask.jsonify(data=app.config["registry"])
    response.headers = {"Access-Control-Allow-Origin": "*"}
    return response


# A voir plus tard si nécessaire
def operator_list_def(operator_var):
    if app.config["PLATFORM-ID"] == "1":
        with open("operator_list_xml.dict", "rb") as fp:
            test = pickle.load(fp)[operator_var]
            return (eval(test))

    if app.config["PLATFORM-ID"] == "3":
        with open("operator_list_sql.dict", "rb") as fp:
            return pickle.load(fp)[operator_var]
    with open("operator_list_mongo.dict", "rb") as fp:
        return pickle.load(fp)[operator_var]


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
    try:
        m = datetime.datetime.strptime(date_str, "%d %B %Y")
    except ValueError:
        try:
            m = datetime.datetime.strptime(date_str, "%d %b %Y")
        except ValueError:
            try:
                m = datetime.datetime.strptime(date_str, "%Y/%m/%d")
            except ValueError:
                try:
                    m = datetime.datetime\
                        .strptime(date_str,"%d/%m/%Y %H:%M:%S")
                except ValueError:
                    try:
                        m = datetime.datetime\
                            .strptime(date_str, "%Y-%m-%d %H:%M:%S")
                    except ValueError:
                        try :
                            m = datetime.datetime.strptime(date_str,
                                                       "%d %m %Y")
                        except ValueError:
                            # HERE ADD A FORMAT TO CHECK
                            print("Format not recognised. \nConsider "
                                  "adding a date format "
                                  "in the function \"format_date\".")

    return m

def get_metadata(model, query, dicttoxml=None):
    '''
    Get metadata from request : gateway technical interoperability function
    :param key:
    :param model:
    :param operator:
    :param operand:
    :return: Results of request as list of objects
    '''
    # TODO: Handle $in operator and other not fully implemented + data type handling
    # print(query.split("#_#SEPARATOR#_#"), file=sys.stderr)



    # ISO 19115 / ODATIS
    if app.config["PLATFORM-ID"] == "1":
        # return []
        import xml.etree.ElementTree as ET
        import re
        import pandas as pd
        root = ET.parse("ODATIS/metadata.xml").getroot()

        def XML_to_dict(xml):
            xml_tag = re.sub("{.*}", "", xml.tag)
            res_dict = {xml_tag: {}}
            path = [xml_tag]

            def tree_walk(xml, path):
                aux_path = path
                for child in list(xml):
                    child_tag = re.sub("{.*}", "", child.tag)
                    aux = res_dict
                    for i in path:
                        aux = aux[i]
                    if child_tag in aux:
                        for attr in child.attrib:

                            if re.sub("{.*}", "", attr) in aux[child_tag]:

                                if isinstance(aux[child_tag][re.sub("{.*}", "", attr)], list):
                                    aux[child_tag][re.sub("{.*}", "", attr)].append(child.attrib[attr])
                                else:
                                    aux[child_tag][re.sub("{.*}", "", attr)] = [aux[child_tag][
                                                                                    re.sub("{.*}", "", attr)]] + [
                                                                                   child.attrib[attr]]
                            else:
                                aux[child_tag][re.sub("{.*}", "", attr)] = child.attrib[attr]
                        if isinstance(child.text, str):
                            if child.text.strip():
                                if "@value" in aux[child_tag]:
                                    if isinstance(aux[child_tag]["@value"], list):

                                        aux[child_tag]["@value"].append(child.text)
                                    else:
                                        aux[child_tag]["@value"] = [aux[child_tag]["@value"]] + [child.text]
                                else:
                                    aux[child_tag]["@value"] = child.text
                    else:
                        aux[child_tag] = {}
                        for attr in child.attrib:
                            aux[child_tag][re.sub("{.*}", "", attr)] = child.attrib[attr]
                        if isinstance(child.text, str):
                            if child.text.strip():
                                aux[child_tag]["@value"] = child.text
                    tree_walk(child, aux_path + [child_tag])

            for child in list(xml):
                child_tag = re.sub("{.*}", "", child.tag)
                if child_tag in res_dict[xml_tag]:
                    for attr in child.attrib:
                        if re.sub("{.*}", "", attr) in res_dict[xml_tag][child_tag]:
                            if isinstance(res_dict[xml_tag][child_tag][re.sub("{.*}", "", attr)], list):
                                res_dict[xml_tag][child_tag][re.sub("{.*}", "", attr)].append(child.attrib[attr])
                            else:
                                res_dict[xml_tag][child_tag][re.sub("{.*}", "", attr)] = [res_dict[xml_tag][child_tag][
                                                                                              re.sub("{.*}", "",
                                                                                                     attr)]] + [
                                                                                             child.attrib[attr]]
                        else:
                            res_dict[xml_tag][child_tag][re.sub("{.*}", "", attr)] = child.attrib[attr]
                    if isinstance(child.text, str):
                        if child.text.strip():
                            if "@value" in res_dict[xml_tag][child_tag]:
                                if isinstance(res_dict[xml_tag][child_tag]["@value"], list):
                                    res_dict[xml_tag][child_tag]["@value"].append(child.text)
                                else:
                                    res_dict[xml_tag][child_tag]["@value"] = [res_dict[xml_tag][child_tag][
                                                                                  "@value"]] + [child.text]
                            else:
                                res_dict[xml_tag][child_tag]["@value"] = child.text
                else:
                    res_dict[xml_tag][child_tag] = {}
                    for attr in child.attrib:
                        res_dict[xml_tag][child_tag][re.sub("{.*}", "", attr)] = child.attrib[attr]
                    if isinstance(child.text, str):
                        if child.text.strip():
                            if "@value" in res_dict[xml_tag][child_tag]:
                                if isinstance(res_dict[xml_tag][child_tag]["@value"], list):
                                    res_dict[xml_tag][child_tag]["@value"].append(child.text.strip())
                                else:
                                    res_dict[xml_tag][child_tag]["@value"] = res_dict[xml_tag][child_tag]["@value"] + [
                                        child.text]

                            else:
                                res_dict[xml_tag][child_tag]["@value"] = child.text
                tree_walk(child, path + [child_tag])
            return res_dict

        def walk_tree(key, root, operator, operand):
            bool = False
            if len(key.split(".")) > 1:
                aux = key.split(".")[1:]
            else:
                aux = key
            for i in root:

                if aux[0] in i.tag:

                    if len(key.split(".")) == 3:
                        if operator(i.text, operand):
                            return True
                        else:
                            return False

                    bool = walk_tree(".".join(aux), i, operator, operand)
            if bool:
                return root
            else:
                return []

        try:
            aux_query = query.split("#_#SEPARATOR#_#")
            aux_key = aux_query[0].replace("@", "")
            data = (walk_tree(aux_key, root, operator_list_def(aux_query[1]), aux_query[2]))
            if data != []:
                # print("coucou \n\n\n", file=sys.stderr)
                # print(pd.json_normalize(XML_to_dict(root), sep=".").to_dict(), file=sys.stderr)
                return XML_to_dict(root)
            else:
                # print((data), file=sys.stderr)
                return []
            # print(data,file=sys.stderr)
            #     return data
        except Exception as e:
            print(e, file=sys.stderr)
            # print(data, file=sys.stderr)
            return []
    # # FHIR
    if app.config["PLATFORM-ID"] == "3":
        import MySQLdb

        aux_query = ""
        multiple = False

        splitted_query = query.split("#_#SEPARATOR#_#")

        while (True):

            if multiple:
                logical_operator = splitted_query.pop(0)
            key = splitted_query.pop(0).replace(".", "_")
            operator = splitted_query.pop(0)
            operand = splitted_query.pop(0)
            if multiple:
                aux_query += " " + logical_operator + " " + key + " " + operator_list_def(operator) + " " + operand

            else:
                aux_query += key + " " + operator_list_def(operator) + " " + operand
            multiple = True
            if len(splitted_query) == 0:
                break

        print(aux_query, file=sys.stderr)
        db = MySQLdb.connect("database_sql", database="FHIR")
        db_cursor = db.cursor()
        db_cursor.execute("SELECT * FROM Location_hl7east WHERE " + aux_query + " ;")
        ret = db_cursor.fetchall()
        ret_list = []
        name = [i[0].replace("_", ".") for i in db_cursor.description]
        for res_req in ret:
            dict_ret = {}

            for index, col_name in enumerate(name):
                # print(col_name,index, file=sys.stderr)
                dict_ret[col_name] = res_req[index]
            ret_list.append(dict_ret)
        # print(ret_list, file=sys.stderr)
        return ret_list
    # JSON Database
    # if app.config["PLATFORM-ID"] != "1" and app.config["PLATFORM-ID"] !="3":
    aux_query = {}
    multiple = False
    logical_operator = ""
    splitted_query = query.split("#_#SEPARATOR#_#")
    print(query, file=sys.stderr)
    while (True):

        if multiple:
            logical_operator = splitted_query.pop(0)
        key = splitted_query.pop(0)

        operator = splitted_query.pop(0)
        operand = splitted_query.pop(0)


        print("TA MERE", file=sys.stderr)



        print(key, file=sys.stderr)

        # print(app.config["registry"]["models"][model]["keys"][key], file=sys.stderr)
        # print(app.config["registry"]["models"][model]["keys"][key].startswith("list"), file=sys.stderr)
        print("ALOL :", app.config["registry"]["models"][model]["name"], key, file=sys.stderr)
        if operator == "in":
            if multiple:
                # if isinstance(*aux_query, list):
                # if app.config["registry"]["models"][model]["keys"][key].startswith("list"):
                #     if app.config["COLLECTION"] == "opendatasoft":
                #         key = key.replace(".", "#")
                #     aux_query = {"$" + logical_operator.lower(): [aux_query, {key: {operator_list_def(operator): operand}}]}
                # else:
                if app.config["COLLECTION"] == "opendatasoft":
                    key = key.replace(".", "#")
                aux_query = {"$" + logical_operator.lower(): [aux_query, {key: {"$regex": operand, "$options": "i"}}]}



            else:
                # if app.config["registry"]["models"][model]["keys"][key].startswith("list"):
                #     if app.config["COLLECTION"] == "opendatasoft":
                #         key = key.replace(".", "#")
                #     aux_query = {key: {operator_list_def(operator): float(operand)}}
                # else:
                if app.config["COLLECTION"] == "opendatasoft":
                    key = key.replace(".", "#")
                aux_query = {key: {"$regex": operand, "$options": "i"}}
        else:
            if multiple:
                if app.config["registry"]["models"][model]["keys"][key] == "integer":
                    if app.config["COLLECTION"] == "opendatasoft":
                        key = key.replace(".", "#")
                    aux_query = {
                        "$" + logical_operator.lower(): [aux_query,
                                                         {key: {operator_list_def(operator): float(operand)}}]}
                else :
                    if app.config["registry"]["models"][model]["keys"][key] == "date":
                        if app.config["COLLECTION"] == "opendatasoft":
                            key = key.replace(".", "#")
                        aux_query = {
                            "$" + logical_operator.lower(): [aux_query,
                                                             {key: {operator_list_def(operator): (operand)}}]}
                    else:


                        if app.config["COLLECTION"] == "opendatasoft":
                            key = key.replace(".", "#")
                        aux_query = {
                            "$" + logical_operator.lower(): [aux_query, {key: {operator_list_def(operator): operand}}]}


            else:

                if app.config["registry"]["models"][model]["keys"][key] == "integer":
                    if app.config["COLLECTION"] == "opendatasoft":
                        key = key.replace(".", "#")

                    aux_query = {key: {operator_list_def(operator): float(operand)}}
                else:
                    if app.config["COLLECTION"] == "opendatasoft":
                        key = key.replace(".", "#")
                    aux_query = {key: {operator_list_def(operator): operand}}



        multiple = True
        print("ON EST Là ", aux_query, file=sys.stderr)
        print("ON EST Là ", aux_query, file=sys.stderr)
        print("ON EST Là ", aux_query, file=sys.stderr)
        print(splitted_query, file=sys.stderr)

        if len(splitted_query) == 0:
            break


    print("RESULT REQUEST : ", file=sys.stderr)
    print(app.config["COLLECTION"] + " : " + str(aux_query), file=sys.stderr)
    return (
        list(pymongo.MongoClient("193.168.2.20:27017", maxPoolSize=10)[app.config["COLLECTION"]].interop_metadata.find(
            aux_query, {"_id": False}).limit(100)))


def match_concept_in_query(query, matchs, local_model):
    '''
    Transformation function for query based on matches
    :param query: str: the query to transform
    :param matchs: (str,str,list,str,float):list of tuple containing match, model, match_platform_list, concept, score
    :param target_model: str : The model in which the converted concept must originate
    :param targeted_platform : str (id) : targeted platform that will execute this query
    :return: transformed query with match applied
    '''
    separator = "#_#SEPARATOR#_#"
    aux_query = ""
    list_elem_query = query.split(separator)
    multiple = False
    while (True):

        if multiple:
            logical_operator = list_elem_query.pop(0)
        key_var = list_elem_query.pop(0)
        operator_var = list_elem_query.pop(0)
        operand_var = list_elem_query.pop(0)

        match_found = False
        match_key = ""
        # For score using, not implemented yet
        # match_score = - math.inf
        if key_var in app.config["registry"]["models"][app.config["MODEL"]]["keys"]:
            print("TA MERE OUAIS", file=sys.stderr)
            match_found=True
            match_key = key_var
        else :
            for match, match_model, concept, concept_model in matchs:

                if concept == key_var and match_model==local_model:
                    print(concept, key_var,match, file=sys.stderr)
                    match_found = True
                    # if score > match_score:
                    match_key = match
                if match == key_var and concept_model == local_model:
                    match_found = True
                    # if score > match_score:
                    match_key = concept
                if match == key_var and match_model == local_model:
                    match_found = True
                    # if score > match_score:
                    match_key = concept
                if concept == key_var and concept_model == local_model:
                    match_found = True
                    # if score > match_score:
                    match_key = concept


        print("MATCH FOUND : " , match_found,file=sys.stderr)

        if match_found:
            if multiple:
                print("JELLO: ",key_var, match_key, app.config["registry"]["models"][local_model]["name"], file=sys.stderr)
                if aux_query !="":


                    aux_query += separator + logical_operator + separator + match_key + separator + operator_var + separator + operand_var
                else :
                    aux_query += match_key + separator + operator_var + separator + operand_var
            else:
                print("JELLU: ",key_var, match_key, app.config["registry"]["models"][local_model]["name"], file=sys.stderr)
                aux_query += match_key + separator + operator_var + separator + operand_var
        # else :
        #     return ""

        multiple = True
        if len(list_elem_query) == 0:
            break

    return aux_query


def transitive_closure(matches):
    '''
    Transitive closure computing function ; get all matches (based on equality match relationship)
    :param matches: list[tuples] : list of matches
    :return:
    '''
    closure = set(matches) | set([(x, modelx, y, modely) for y, modely, x, modelx in matches])

    while True:

        new_relations = (set(
            (i, modeli, w, modelw) for i, modeli, j, modelj in closure for q, modelq, w, modelw in closure if
            q == j and i != w and modelj != modelq) |
                         set((i, modeli, q, modelq) for i, modeli, j, modelj in closure for q, modelq, w, modelw in
                             closure if w == j and i != q and modelj != modelq) |
                         set((j, modelj, w, modelw) for i, modeli, j, modelj in closure for q, modelq, w, modelw in
                             closure if q == i and j != w and modelj != modelq) |
                         set((j, modelj, q, modelq) for i, modeli, j, modelj in closure for q, modelq, w, modelw in
                             closure if w == i and j != q and modelj != modelq))
        closure_done = closure | new_relations
        if closure_done == closure:
            break
        closure = closure_done
    return closure

@app.route('/request', methods=['GET'])
def request_metadata():
    '''
    Header variable doc :
    "initiator" : ID of the query initializer platform
    "model" : model requested
    "key" : key from the model requested
    "operator" : operator used for the request (see operator list)
    "value": value for the request
    :return:
    '''

    # ONLY FOR DEMONSTRATION, NOT USEFULL IN OTHER CASE, CAN BE REMOVED
    if app.config["MODEL"]=="":
        for model_key in app.config["registry"]["models"]:
            if app.config["registry"]["models"][model_key]["name"] == os.environ["MODEL-NAME"]:
                app.config["MODEL"] = model_key
    if "initiator" not in request.headers:
        return flask.Response("initiator header variable not defined (platform id that initiate the request), "
                              "needed for request routage", status=400)
    if "model" not in request.headers:
        return flask.Response("model header variable not defined, needed for request and match finding", status=400)
    if "query" not in request.headers:
        return flask.Response("query not defined, needed for request ", status=400)
    if "jump" not in request.headers:
        return flask.Response("jump (inverse of time to live) header variable not defined ; needed for routing",
                              status=400)
    if "platforms-visited" not in request.headers:
        return flask.Response("platforms-visited header variable not defined ; needed for routing", status=400)
    # if "operator" not in request.headers:
    #     return flask.Response("operator header variable not defined ; needed for request",status=400)
    # if "operand" not in request.headers:
    #     return flask.Response("operand header variable not defined ; needed for request",status=400)
    if "request-id" not in request.headers:
        return flask.Response("request-id header variable not defined; needed to avoid loop", status=400)
    # Platform id of the request creator
    if "platform-id" not in request.headers:
        return flask.Response("platform-id header variable not defined; needed for routing", status=400)

    ret = {}
    if (request.headers["request-id"] in app.config["REQUEST-ID-LIST"]
            and request.headers["initiator"] != request.headers["platform-id"]):
        return flask.Response(status=208)
    else:
        app.config["REQUEST-ID-LIST"].append(request.headers["request-id"])

    local_model = ""
    for key in app.config["registry"]["models"]:
        if app.config["PLATFORM-ID"] in app.config["registry"]["models"][key]["platforms"]:
            local_model = key

    matchs = [(app.config["registry"]["matchs"][key]["keyB"],
               app.config["registry"]["matchs"][key]["modelB"],
               app.config["registry"]["models"][app.config["registry"]["matchs"][key]["modelB"]][
                   "platforms"],
               app.config["registry"]["matchs"][key]["keyA"],
               app.config["registry"]["matchs"][key]["modelA"],
               app.config["registry"]["models"][app.config["registry"]["matchs"][key]["modelA"]][
                   "platforms"],
               app.config["registry"]["matchs"][key]["score"]

               ) for key in app.config["registry"]["matchs"] ]

    matched_query = match_concept_in_query(
        request.headers["query"],
        transitive_closure([(keyA, modelA, keyB, modelB) for keyA, modelA, _, keyB, modelB, _, _ in matchs]),
        app.config["MODEL"])
    print("hello world" , file=sys.stderr)
    # print(        transitive_closure([(keyA, modelA, keyB, modelB) for keyA, modelA, _, keyB, modelB, _, _ in matchs]),file=sys.stderr)
    print(request.headers["query"], file=sys.stderr)
    print(matched_query, file=sys.stderr)
    if matched_query != "":

        ret[app.config["PLATFORM-ID"]] = (get_metadata(model=local_model, query= matched_query))
    else :
        ret[app.config["PLATFORM-ID"]] = []

    for platform_id in app.config["registry"]["platforms"][app.config["PLATFORM-ID"]]["links"]:
        rep = req.get(app.config["registry"]["platforms"][platform_id]["URL"][0] + "/request",
                      headers={"platforms-visited":
                                   request.headers["platforms-visited"] + ","
                                   + app.config.get("PLATFORM-ID"),
                               "jump": str(int(request.headers["jump"]) + 1),
                               "model": request.headers["model"],
                               "platform-id": app.config["PLATFORM-ID"],
                               "initiator": request.headers["initiator"],
                               "request-id": request.headers["request-id"],
                               'Content-type': 'application/json',
                               'Accept': 'application/json',
                               'query': request.headers["query"],
                               # 'query_modified':req_aux
                               }
                      , timeout=20)

        if rep.status_code == 200:
            try:
                ret = {**ret, **json.loads(rep.text)}
            except Exception as e:
                print(e, file=sys.stderr)
    print(len(ret),file=sys.stderr)
    return ret

def get_node_nearest_from_distribution():
    '''
    Calcul of best node to link to based on actual distribution of degree
    :param node:
    :return:
    '''
    import copy
    gamma = 2.5
    node_degree = 2
    value_divkb = sys.float_info.max
    node_number = app.config["registry"]["network"]["node_number"]
    for index in range(len(degree_distrib := app.config["registry"]["network"]["degrees_distribution"]) - 1):
        # If no node of degree X, it's not possible to connect a node to it
        if len(degree_distrib[index]) > 0:

            degree = index + 2

            pn = ((len(degree_distrib[index])) - 1) / node_number
            pn_one = ((len(degree_distrib[index + 1])) + 1) / node_number

            # based on the lim x log(x) = 0 for x -> 0
            if pn == 0:
                part_one = 0
            else:
                part_one = pn * math.log(pn / degree ** gamma)
            if pn_one == 0:
                part_two = 0
            else:
                part_two = pn_one * math.log(pn_one / (degree + 1) ** gamma)
            #     If the already connected node is the node to connect the most suited, take the second most suited
            if part_one + part_two < value_divkb:
                aux = copy.deepcopy(app.config["registry"]["network"]["degrees_distribution"][degree - 2])
                for node in app.config["registry"]["network"]["degrees_distribution"][node_degree - 2]:
                    try:
                        aux.remove(node)
                    except:
                        pass
                if len(aux) > 0:
                    node_degree = degree

    print(app.config["registry"]["network"], file=sys.stderr)
    print(node_degree, file=sys.stderr)
    list_of_platform_to_connect_to = list(app.config["registry"]["network"]["degrees_distribution"][node_degree - 2])
    #     try :
    #         list_of_platform_to_connect_to.remove(app.config["PLATFORM-ID"])
    #     except:
    #         pass
    return list_of_platform_to_connect_to


def add_model(model, model_id):
    update_registry({"models": {model_id: model}})


@app.route('/inscription', methods=['GET'])
def get_node_to_link_to():
    from copy import deepcopy
    # To test the path
    # curl -X GET 193.168.1.10:5000/inscription -H 'platform-id:4'  -H 'Content-Type:application/json'
    # -H 'existing-model:2'
    # -d '{"platforms":{"4":{"name":"DATAVERSE","URL":["http://193.168.1.13:5000"], "links":["2"]}}}'

    aux_registry = deepcopy(app.config["registry"])
    # data = request.get_json()
    print(request.headers, file=sys.stderr)
    if "Platform-Id" not in request.headers:
        #         return "No platform-id header", 400
        return flask.Response(status=400, response="No platform-id")
    # if "existing-model-id" not in request.headers:
    #     if "models" not in data:
    #         return "No model defined"
    #     if "matchs" not in data:
    #         return "No matches defined"
    # Simulate the adding of the platform in the registry to have to list of platform to connect to
    platform_toadd_id = request.headers["platform-id"]
    aux_registry["network"]["node_number"] += 1
    aux_registry["network"]["degrees_distribution"][0].append(platform_toadd_id)
    aux_registry["network"]["degrees_distribution"][
        len(aux_registry["platforms"][app.config["PLATFORM-ID"]]["links"]) - 2].remove(app.config["PLATFORM-ID"])
    aux_registry["platforms"][app.config["PLATFORM-ID"]]["links"].append(platform_toadd_id)
    aux_registry["network"]["degrees_distribution"][
        len(aux_registry["platforms"][app.config["PLATFORM-ID"]]["links"]) - 2].append(app.config["PLATFORM-ID"])
    if len(aux_registry["network"]["degrees_distribution"][
               len(aux_registry["network"]["degrees_distribution"]) - 1]) != 0:
        aux_registry["network"]["degrees_distribution"].append([])

    response = flask.jsonify(data=get_node_nearest_from_distribution())
    response.headers = {"Access-Control-Allow-Origin": "*"}
    return response


#     response.headers={"Access-Control-Allow-Origin":"*"}
#     return )


@app.route('/inscription', methods=['POST'])
def link_platforms():

    platform_toadd_id = request.headers["platform-id"]
    platform_tolinkto_id = request.headers["platform-tolink"]
    data = request.get_json()
    # pprint.pprint(app.config["registry"]["models"],stream=sys.stderr)
    app.config["registry"]["platforms"][platform_toadd_id] = data["platforms"][platform_toadd_id]
    if "existing-model-id" in request.headers:
        for model in request.headers["existing-model-id"].split(","):
            app.config["registry"]["models"][model]["platforms"].append(platform_toadd_id)
    else:
        for model_id in data["models"]:
            add_model(data["models"], model_id)
    if "matchs" in data:
        for match_id in data["matchs"]:
            app.config["registry"]["matchs"][match_id] = data["matchs"]
    app.config["registry"]["network"]["degrees_distribution"][0].append(platform_toadd_id)
    app.config["registry"]["network"]["degrees_distribution"][
        len(app.config["registry"]["platforms"][platform_tolinkto_id]["links"]) - 2].remove(platform_tolinkto_id)
    app.config["registry"]["platforms"][platform_tolinkto_id]["links"].append(platform_toadd_id)
    app.config["registry"]["network"]["degrees_distribution"][
        len(app.config["registry"]["platforms"][platform_tolinkto_id]["links"]) - 2].append(platform_tolinkto_id)
    app.config["registry"]["network"]["degrees_distribution"][
        len(app.config["registry"]["platforms"][app.config["PLATFORM-ID"]]["links"]) - 2].remove(
        app.config["PLATFORM-ID"])
    app.config["registry"]["platforms"][app.config["PLATFORM-ID"]]["links"].append(platform_toadd_id)
    app.config["registry"]["network"]["degrees_distribution"][
        len(app.config["registry"]["platforms"][app.config["PLATFORM-ID"]]["links"]) - 2].append(
        app.config["PLATFORM-ID"])
    # Add a new empty list at the end to avoid out of range error
    if len(app.config["registry"]["network"]["degrees_distribution"][
               len(app.config["registry"]["network"]["degrees_distribution"]) - 1]) != 0:
        app.config["registry"]["network"]["degrees_distribution"].append([])
    # Save the registry and propagate to other platforms
    save_registry()
    return flask.Response(status=204)


def update_registry(registry_add):
    for key in registry_add:
        if key == "platforms":
            for platforms_id in registry_add["platforms"]:
                if platforms_id in app.config["registry"]["platforms"]:
                    raise KeyError(platforms_id + " already exists. Change platform ID.")
                else:
                    app.config["registry"]["platforms"][platforms_id] = registry_add["platforms"][platforms_id]
        if key == "models":

            for models_id in registry_add["models"]:
                if models_id in app.config["registry"]["models"]:
                    raise KeyError(models_id + " already exists. Change models ID.")
                else:
                    app.config["registry"]["models"][models_id] = registry_add["models"][models_id]
        if key == "matchs":
            for match_id in app.config["registry"]["matchs"]:
                if match_id in app.config["registry"]["matchs"]:
                    raise KeyError(match_id + " already exists. Change match ID.")
                else:
                    app.config["registry"]["matchs"][match_id] = registry_add["matchs"][match_id]
    with open("registry.dict", "wb") as fp:
        pickle.dump(app.config["registry"], fp)


@app.route("/test")
def test():
    pprint.pprint(app.config["registry"]["platforms"], stream=sys.stderr)
    return "ok"


def save_registry(matchonly=False):
    import time
    with open("registry.dict", "wb") as fp:
        pickle.dump(app.config["registry"], fp)
    for platform_id in app.config["registry"]["platforms"][app.config["PLATFORM-ID"]]["links"]:
        if matchonly:
            rep = req.post(app.config["registry"]["platforms"][platform_id]["URL"][0] + "/registry",
                           headers={"registry-version": str(time.time()), "Content-Type": "application/json",
                                    "Accept": "application/json", "Platforms-visited": app.config["PLATFORM-ID"],
                                    "Platform-Id": app.config["PLATFORM-ID"]},
                           data=json.dumps(app.config["registry"]), timeout=5)
        else :
            rep = req.post(app.config["registry"]["platforms"][platform_id]["URL"][0] + "/registry",
                           headers={"registry-version": str(time.time()), "Content-Type": "application/json",
                                    "Accept": "application/json", "Platforms-visited": app.config["PLATFORM-ID"],
                                    "Platform-Id": app.config["PLATFORM-ID"], "only-matches":""},
                           data=json.dumps(app.config["registry"]), timeout=5)

        if rep.status_code == 400:
            print(rep.text, file=sys.stderr)


if __name__ == '__main__':
    app.run()
