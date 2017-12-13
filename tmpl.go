package sand

import (
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

/* For Development Only , for InitDevRouter(TODO) */
func (s *Sand) addTmpl(router *mux.Router) {
	router.HandleFunc("/v1/{page}.html", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Vary", "Accept-Encoding")
		w.Header().Add("Content-Type", "text/html")
		ps := mux.Vars(r)
		//bytes, _ := Asset("tmpl/" + ps["page"] + ".tmpl")
		reader, err := os.Open("tmpl/" + ps["page"] + ".tmpl")
		if err != nil {
			log.Println("error reading")
			return
		}
		bytes, _ := ioutil.ReadAll(reader)
		tmpl := template.New("html")
		tmpl, err = tmpl.Parse(string(bytes))
		if err != nil {
			log.Println("error parse template")
			return
		}
		//dir, _ := AssetDir("templates")
		dir, err := ioutil.ReadDir("templates")
		if err != nil {
			log.Println("error read templates")
			return
		}
		for _, d := range dir {
			//bytes, err1 := Asset("templates/" + d)
			reader, err = os.Open("templates/" + d.Name())
			if err != nil {
				log.Println("error reading")
				return
			}
			bytes, err1 := ioutil.ReadAll(reader)
			if err1 != nil {
				log.Panicf("Unable to parse: template=%s, err=%s", d.Name(), err)
				return
			}
			tmpl.New(d.Name()).Parse(string(bytes))
		}

		err = tmpl.Execute(w, s) //constant
		if err != nil {
			log.Println("error executing template")
		} else {
			log.Println("parsing", s)
		}
	})
}
