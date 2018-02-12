const fs = require('fs');
const sep = require('path').sep;

const jsonld = require('jsonld').promises;

const ctx = {
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
    'schema': 'http://schema.org/',
    'iot': 'http://iotschema.org/'
};

function isInNamespace(node) {
    return (node['@id'] != undefined && node['@id'].startsWith('http://iotschema.org/')) ||
           node.startsWith('http://iotschema.org/');
}

function isSchemaType(node) {
    return node['@type'] != undefined && node['@type'].indexOf('http://www.w3.org/2000/01/rdf-schema#Class') > -1;
}

function isSchemaProperty(node) {
    return node['@type'] != undefined && node['@type'].indexOf('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property') > -1;
}

function isSchemaEnumeratedValue(node) {
    // TODO not accurate
    return node['@type'] != undefined && node['@type'].some(t => isInNamespace(t));
}

function isSchemaEntity(node) {
    return (isSchemaType(node) ||
            isSchemaProperty(node) ||
            isSchemaEnumeratedValue(node)) &&
           node['http://www.w3.org/2000/01/rdf-schema#label'] != undefined &&
           node['http://www.w3.org/2000/01/rdf-schema#comment'] != undefined
}

function check(node, filename) {
    if (!isInNamespace(node)) console.log(node['@id'] + ' not in iotschema.org namespace (' + filename + ')');
    if (!isSchemaEntity(node)) console.log(node['@id'] + ' missing @type, label or comment (' + filename + ')');
}

fs.readdirSync('..')
    .filter(name => name.endsWith('.jsonld'))
    .forEach(name => {
        let str = fs.readFileSync('..' + sep + name, { encoding: 'utf-8' });
        let def = JSON.parse(str);

        jsonld.flatten(def)
            .then(g => {
                g.forEach(n => check(n, name));
            });
    });