import React from "react";

export const loadState = () => {
    try {
        const serializedState = localStorage.getItem('state');
        console.log("LOAD STATE")
        console.log(serializedState)
        if (serializedState === null) {
            return {"matches":[],"id_match":0,"model":[]};
        }

        const state = {...JSON.parse(serializedState)};
        if (!(state["matches"])){
            state["matches"]=[];
            state["id_match"]=0;
        }
        if (!(state["model"])){
            state["model"]=[];
        }
        if (!(state["platform"])){
            state["platform"]=[];
        }
        if (!(state["modelName"])){
            state["modelName"]="";
        }
        return state;
    } catch (err) {
        return [];
    }
};

export const saveState = (state) => {
    try {
        const serializedState = JSON.stringify(state);
        console.log("SAVE STATE")
        console.log(serializedState)
        localStorage.setItem('state', serializedState);
    } catch {
        // ignore write errors
    }
};
// TODO : change list dynamically
const initialState = {
    ...loadState(),
}




export function rootReducer(state = initialState, action) {
    // Check if this action has to be handled
    let newState = {...state}

    switch (action.type) {
        case("ADD_MATCHES"): {
            console.log(action)
            console.log(newState)
            newState["matches"]=action.matches;
            newState["id_match"]=action.id_match;

            console.log(newState)
            saveState(newState)
            return {...newState}
        }
        case("ADD_MODEL"): {
            console.log("ADD MODEL")
            console.log(action)
            console.log(newState)
            newState["model"]=action.model;
            newState["modelName"]=action.modelName;
            // newState["id_aux"]=action.id_aux;
            newState["modelId"]=action.modelID;

            console.log(newState)
            saveState(newState)
            return {...newState}
        }
        case("ADD_PLATFORM"): {
            console.log("ADD PLATFORM")
            console.log(action.platform)
            console.log(newState)
            newState["platform"]=action.platform;
            // newState["id_aux"]=action.id_aux;

            console.log(newState)
            saveState(newState)
            return {...newState}
        }
        default: {
            return state

        }
        // otherwise return the existing state unchanged
    }
}