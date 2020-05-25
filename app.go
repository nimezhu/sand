package sand

//go:generate go-bindata-assetfs -pkg sand app/...
import (
	"html/template"
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
)

func addType(uri string, w http.ResponseWriter) {
	a := strings.Split(uri, ".")
	s := a[len(a)-1]
	if s == "js" {
		w.Header().Add("Content-Type", "text/javascript")
	}
	if s == "css" {
		w.Header().Add("Content-Type", "text/css")
	}
}

func bindataServer(root string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Our middleware logic goes here...
		id := root + r.RequestURI
		bytes, err := Asset(id)

		if err != nil {
			w.Write([]byte("file not found"))
		} else {
			addType(r.RequestURI, w)
			w.Write(bytes)
		}
	})
}
func addBindata(router *mux.Router) {
	router.PathPrefix("/web/").Handler(bindataServer("app"))
	router.PathPrefix("/data/").Handler(addAuthHandler(bindataServer("app")))
	router.PathPrefix("/admin/").Handler(addAdminHandler(bindataServer("app")))
}
func (s *Sand) addOpenBindata(router *mux.Router) {
	router.PathPrefix("/web/").Handler(bindataServer("app"))
	router.PathPrefix("/data/").Handler(bindataServer("app"))
	router.PathPrefix("/admin/").Handler(addAdminHandler(bindataServer("app")))
}

//TODO change to middleware handler
func (s *Sand) addTmplBindata(router *mux.Router) {
	router.HandleFunc("/v1/{page}.html", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Vary", "Accept-Encoding")
		w.Header().Add("Content-Type", "text/html")
		ps := mux.Vars(r)
		bytes, _ := Asset("app/tmpl/" + ps["page"] + ".tmpl")
		tmpl := template.New("html")
		tmpl, err := tmpl.Parse(string(bytes))
		dir, _ := AssetDir("app/templates")
		for _, d := range dir {
			bytes, err1 := Asset("app/templates/" + d)
			if err1 != nil {
				log.Panicf("Unable to parse: template=%s, err=%s", d, err)
			}
			tmpl.New(d).Parse(string(bytes))
		}
		if err != nil {
			log.Println("error parse template")
		}
		err = tmpl.Execute(w, s) //constant
		if err != nil {
			log.Println("error executing template")
		}
	})
}
