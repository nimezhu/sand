package main

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/nimezhu/sand"
	"github.com/nimezhu/snowjs"
	"github.com/urfave/cli"
)

func CmdApp(c *cli.Context) error {
	uri := c.String("input")
	port := c.Int("port")
	mode := c.String("mode")
	root := c.String("root")
	router := mux.NewRouter()
	cred := c.String("cred")
	s := sand.Sand{
		"s2 tools",
		root,
		"s2",
		VERSION,
		[]string{},
		[]string{},
		[]string{},
		"S.render",
	}
	idxRoot := s.InitIdxRoot(root) //???
	sand.InitCred(cred)
	addDataServer(uri, router, idxRoot) //TODO
	snowjs.AddHandlers(router, "")
	s.AddOpenBindata(router)
	s.AddTmplBindata(router)

	// TODO addAuthTo(router)
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/v1/main.html", http.StatusTemporaryRedirect)
	})
	s.AddAuthTo(router)
	s.InitHome(root)
	s.Start(mode, port, router)

	return nil
}
