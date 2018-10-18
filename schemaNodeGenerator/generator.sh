npm install
rm -rf ~/.node-red/package-lock.json
rm -rf GeneratedNodes/*
for file in IPshapes/*; do
    node  NodeGen.js --file=$file
    sleep 2
done
mkdir -p ~/.node-red/SchemaNodes
for d in GeneratedNodes ; do
    cp -R $d ~/.node-red/SchemaNodes/
done
npm install --prefix ~/.node-red ~/.node-red/SchemaNodes/GeneratedNodes/*
