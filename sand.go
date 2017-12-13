package sand

import (
	"net/http"

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
}

/*InitRouter : add template bindata , webpages, snowjs and admin pages to router */
func (s *Sand) InitRouter(router *mux.Router) {
	snowjs.AddHandlers(router, "")
	s.addOpenBindata(router)
	s.addTmplBindata(router)
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/v1/main.html", http.StatusTemporaryRedirect)
	})
	s.addAuthTo(router)
}
