const fs = require('fs');
const sep = require('path').sep;

const jsonld = require('jsonld').promises;

function isInNamespace(node) {
    return node['@id'].startsWith('http://iotschema.org/');
}

function isSchemaEntity(node) {
    return [
        'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property',
        'http://www.w3.org/2000/01/rdf-schema#Class'
    ].indexOf(node['@type']) > -1 &&
    node['http://www.w3.org/2000/01/rdf-schema#label'] &&
    node['http://www.w3.org/2000/01/rdf-schema#comment']
}

fs.readdirSync('..')
    .filter(name => name.endsWith('.jsonld'))
    .forEach(name => {
        let str = fs.readFileSync('..' + sep + name, { encoding: 'utf-8' });
        let def = JSON.parse(str);

        jsonld.flatten(def)
            .then(g => {
                g.forEach(n => {
                    if (!isInNamespace(n)) console.log(n['@id'] + ' not in iotschema.org namespace (' + name + ')');
                    if (!isSchemaEntity(n)) console.log(n['@id'] + ' missing @type, label or comment (' + name + ')');
                });
            });
    });