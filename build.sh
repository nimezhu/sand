cd jslib
npm run build
cd ../
go generate
go build
cp ./jslib/dist/sand.min.js ~/cnbRun/static/lib/sand.min.js
