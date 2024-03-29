package sand

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/nimezhu/snowjs"
)

/*Sand : a communicated multi window and muiti panel system.
 */
type Sand struct {
	Appname string
	Root    string
	Home    string
	Version string
	Libs    []string
	Tail    []string
	Styles  []string
	Renders string
	Mode    map[string]string // lite, initedLayout, fixedLayout
	ExtID   string            //Chrome Extenstion ID , port to connect.
}

func modesText(d map[string]string) string {
	var buffer bytes.Buffer
	for k, v := range d {
		buffer.WriteString(fmt.Sprintf("%s=%s&", k, v))
	}
	s := buffer.String()
	if len(s) > 0 {
		s = strings.TrimRight(s, "&")
	}
	return s
}

/*InitRouter : add template bindata , webpages, snowjs and admin pages to router */
func (s *Sand) InitRouter(router *mux.Router) {
	snowjs.AddHandlers(router, "")
	s.addOpenBindata(router)
	s.addTmplBindata(router)
	/* Lite Version without Google Sheet Support */
	if v, ok := s.Mode["lite"]; ok && v == "1" {

	} else {
		addGSheetsHandler(router)
	}
	/* TODO Add Fixed Layout Mode
	 * config = ...
	 * fixedLayout = 1
	 */
	/* Add Auth Redirect to Sign Up Page */
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		session, _ := store.Get(r, sessionID)
		userStr := session.Values["user"]
		if userStr != nil {
			http.Redirect(w, r, "/v1/main.html?"+modesText(s.Mode), http.StatusTemporaryRedirect)
		} else {
			http.Redirect(w, r, "/entry/", http.StatusTemporaryRedirect) //Static Main TODO
		}
	})
	/********************/
	s.addAuthTo(router)
	router.HandleFunc("/version", func(w http.ResponseWriter, r *http.Request) {
		a, err := json.Marshal(s)
		if err == nil {
			w.Write(a)
		} else {
			w.Write([]byte("{'error':'not found'}"))
		}
	})
}
