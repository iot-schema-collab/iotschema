'use strict'
/*This script generates one shape file for each interaction pattern of iot.schema.org*/
const fs = require('fs');
const sep = require('path').sep;

const jsonld = require('jsonld').promises;

const prefix = "@prefix dash: <http://datashapes.org/dash#> . " +
"@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> . " +
"@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> . " +
"@prefix schema: <http://schema.org/> . "+
"@prefix sh: <http://www.w3.org/ns/shacl#> . "+
"@prefix xsd: <http://www.w3.org/2001/XMLSchema#> . "+
"@prefix iot: <http://iotschema.org/> . "+
"@prefix iotsh: <http://iotschema.org/shapes/> . "
;

function isInteractionPattern(node) {
    // TODO transitive
	
	if(node['http://www.w3.org/2000/01/rdf-schema#subClassOf'] != undefined){
		if(node['http://www.w3.org/2000/01/rdf-schema#subClassOf'][0]['@id'] === 'http://iotschema.org/Property' || 
		   node['http://www.w3.org/2000/01/rdf-schema#subClassOf'][0]['@id'] === 'http://iotschema.org/Event' ||
           node['http://www.w3.org/2000/01/rdf-schema#subClassOf'][0]['@id'] === 'http://iotschema.org/Action'){
			   return node;
		}
	}
}

function isDataNode(node) {
    return node['http://www.w3.org/2000/01/rdf-schema#subClassOf'] != undefined && 
        node['http://www.w3.org/2000/01/rdf-schema#subClassOf'].some(o => {
                return o['@id'] === 'http://schema.org/PropertyValue';
           });
}

function isObservableProperty(node) {
    // TODO transitive
    return node['http://www.w3.org/2000/01/rdf-schema#subClassOf'] != undefined && 
        node['http://iotschema.org/observable'] != undefined &&
        node['http://www.w3.org/2000/01/rdf-schema#subClassOf'].some(o => {
                return o['@id'] === 'http://iotschema.org/Property';
           });
}

function getLocalName(node) {
    return node['@id'].replace('http://iotschema.org/', '');
}
function getDataType(nodeId){

	if(nodeId === "http://schema.org/Float"){
		//console.log("float");
		return "xsd:float";
	}
	else if(nodeId === "http://schema.org/Integer" || nodeId === "http://schema.org/Number"){
		//console.log("integer");
		return "xsd:integer";
	}
	else if(nodeId === "http://schema.org/Text"){
		//console.log("text");
		return "xsd:string";
	}
	else if(nodeId === "http://schema.org/Boolean" || nodeId === "schema:Boolean"){
		//console.log("boolean");
		return "xsd:boolean";
	}
	else if(nodeId === "http://schema.org/False" || nodeId === "schema:False"){
		//console.log("false");
		return false;
	}
	else if(nodeId === "http://schema.org/True" || nodeId === "schema:True"){
		//console.log("true");
		return true;
	}	
	else{
		//console.log("custom");
		return "custom";
		}
}
function getURI(id){
	
	if(id.includes("http://schema.org/")){
		var term = id.slice(id.lastIndexOf("/")+1);
		term = "schema:"+term;
		return term;
	}
	if(id.includes("http://iotschema.org/")){
		var term = id.slice(id.lastIndexOf("/")+1);
		term = "iot:"+term;
		return term;	
	}
}
function getEnumValues(nodeId){
	//TODO: get all values in json get the enum values array and parse and process here
	var datatype;
	var enumValues = "( ";
	for (var i = 0; i < pattern.length; i++) {
		if(pattern[i]['@type'] == nodeId){
			enumValues = enumValues + getURI(pattern[i]['@id'])+" ";
		}	 
	}
	enumValues = enumValues + ")";
	return enumValues;
}

let units = [];
function loadUnits(){
fs.readdirSync('..')
    .filter(name => name.endsWith('unit.jsonld'))
    .forEach(name => {
        let str = fs.readFileSync('..' + sep + name, { encoding: 'utf-8' });
        let def = JSON.parse(str);
        jsonld.flatten(def)
            .then(g => {
                g.forEach(n => {
					units.push(n);
					});
            });
    });
}

function getUnits(id){
	var ipUnits = "( ";
		for(var i = 0; i < units.length; i++){
			if(units[i]["@type"] == id){
			ipUnits = ipUnits + getURI(units[i]['@id'])+" ";
			}
		}
		ipUnits = ipUnits + ")";
		return ipUnits;
}

let shapes = "";
let processedNodes = [];
function generate(node) {
	shapes= "";
    if (isInteractionPattern(node)) {
        let name = getLocalName(node);
        let a = "\n iotsh:"+name+"Shape a sh:NodeShape ;" + "\n" +
			" sh:targetClass "+getURI(node["@id"])+" ;" + "\n" +
			" sh:and ("; 
		if(node["http://iotschema.org/providesOutputData"]){
			a = a+"\n[ sh:property [" + "\n" +
			" sh:path" + " " + "iot:providesOutputData ;" + "\n" +
			" sh:minCount 1 ;" + "\n" +
			" sh:maxCount 1 ;" + "\n" +
			" sh:node "+getURI(node["http://iotschema.org/providesOutputData"][0]["@id"])+" ; ]; ]";
		generateData(node["http://iotschema.org/providesOutputData"][0]["@id"]);
		}
        if(node["http://iotschema.org/acceptsInputData"]){
			for(var i in node["http://iotschema.org/acceptsInputData"]){
			a = a+"\n[sh:property [" + "\n" +
			" sh:path" + " " + "iot:acceptsInputData;" + "\n" +
			" sh:minCount 1 ;" + "\n" +
			" sh:maxCount 1 ;" + "\n" +
			" sh:node "+getURI(node["http://iotschema.org/acceptsInputData"][i]["@id"])+" ; ]; ]";
		generateData(node["http://iotschema.org/acceptsInputData"][i]["@id"]);
			}
		}	
		if(node["http://iotschema.org/writable"]){
			a = a+"\n[sh:property [" + "\n" +
			" sh:path" + " " + "iot:writable;" + "\n" +
			" sh:minCount 1 ;" + "\n" +
			" sh:maxCount 1 ;" + "\n" +
			" sh:hasValue "+getDataType(node["http://iotschema.org/writable"][0]["@value"])+" ; ]; ]";
			
			if(node["http://iotschema.org/writable"][0]["@value"] == "schema:False"){
				a = a + " \n[ sh:not [ " + "\n" +
                    "sh:property [ " + "\n" +
                    "sh:path iot:acceptsInputData ; " + "\n" +
					"sh:minCount 1 ; ]]; ]";
			}
		}
		if(node["http://iotschema.org/observable"]){
			a = a+"\n[sh:property [" + "\n" +
			" sh:path" + " " + "iot:observable;" + "\n" +
			" sh:minCount 1 ;" + "\n" +
			" sh:maxCount 1 ;" + "\n" +
			" sh:datatype "+getDataType(node["http://iotschema.org/observable"][0]["@value"])+" ; ]; ]";
		}		
		a = a+" ).";
        shapes = shapes+"\n"+a;
		let interactionShapes = prefix+shapes;
        fs.writeFileSync('..' + sep +"IPShapes"+sep+name+'Shape.ttl', interactionShapes, { encoding: 'utf-8' });

    }
}

function generateData(id){
	var node;
	if(processedNodes.indexOf(id)> -1){
	for(var i=0; i<pattern.length; i++){
		if(pattern[i]["@id"] == id){
			node = pattern[i];
		}
	}
	let name = getLocalName(node);
	let a = "\n iotsh:"+name+"Shape a sh:NodeShape ;" + "\n" +
		" sh:targetClass "+getURI(node["@id"])+" ;" + "\n" +
		" sh:and (\n"; 
	
	if(node["http://schema.org/propertyType"]){
		let datatype = getDataType(node["http://schema.org/propertyType"][0]["@id"]);
	if((datatype != "custom")){	
		a = a+"[ sh:property [" + "\n" +
		" sh:path" + " " + "schema:propertyType ;" + "\n" +
		" sh:minCount 1 ;" + "\n" +
		" sh:maxCount 1 ;" + "\n" +
		" sh:datatype "+ datatype +" ; ]; ]";
		if((datatype == "xsd:float") || (datatype == "xsd:integer")){
			if(node["http://schema.org/minValue"]){
			a = a+"\n[  sh:property [" + "\n" +
			" sh:path" + " " + "schema:minValue ;" + "\n" +
			" sh:minCount 1 ;" + "\n" +
			" sh:maxCount 1 ;" + "\n" +
			" sh:datatype "+ datatype +" ; ]; ]";	
		   }	
			if(node["http://schema.org/maxValue"]){
			a = a+"\n[  sh:property [" + "\n" +
			" sh:path" + " " + "schema:maxValue ;" + "\n" +
			" sh:minCount 1 ;" + "\n" +
			" sh:maxCount 1 ;" + "\n" +
			" sh:datatype "+ datatype +" ; ]; ]";	
		   }
			if(node["http://schema.org/unitCode"]){
			a = a+"\n[ sh:property [" + "\n" +
			" sh:path" + " " + "schema:unitCode ;" + "\n" +
			" sh:minCount 1 ;" + "\n" +
			" sh:maxCount 1 ;" + "\n" +
			//TODO: should add units value set here
			" sh:in "+ getUnits(node["http://schema.org/unitCode"][0]["@id"]) +" ; ]; ]";	
		   }			   
		}
	}
		else if(datatype == "custom"){
		a = a+"[ sh:property [" + "\n" +
		" sh:path" + " " + "schema:propertyType ;" + "\n" +
		" sh:minCount 1 ;" + "\n" +
		" sh:maxCount 1 ;" + "\n" +
		//TODO: add enumeration values
		" sh:in "+ getEnumValues(node["http://schema.org/propertyType"][0]["@id"]) +" ; ]; ]";
		}
		a = a+" ).";
	}
	shapes = shapes+"\n"+a;
  }
  processedNodes.push(id);
}
let pattern = [];
let ids = [];
fs.readdirSync('..')
    .filter(name => name.endsWith('interaction-patterns.jsonld'))
    .forEach(name => {
        let str = fs.readFileSync('..' + sep + name, { encoding: 'utf-8' });
        let def = JSON.parse(str);
		loadUnits();
        jsonld.flatten(def)
            .then(g => {
                g.forEach(n => {
					pattern.push(n);
					ids.push(n['@id']);
					});
            })
            .then(() => {
				for(var i in pattern){
					generate(pattern[i]);
				}
               });
    });