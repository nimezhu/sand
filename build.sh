cd jslib
npm run build
cd ../
go generate
go build
cp ./app/web/lib/sand.min.js ~/cnbRun/static/lib/sand.min.js
