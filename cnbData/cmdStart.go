package main

import (
	"github.com/gorilla/mux"
	"github.com/nimezhu/sand"
	"github.com/urfave/cli"
)

func CmdStart(c *cli.Context) error {
	uri := c.String("input")
	port := c.Int("port")
	mode := "w"
	root := c.String("root")
	router := mux.NewRouter()
	//cred := c.String("cred")
	s := sand.Sand{
		"CMU Dataome Browser",
		root,
		"dataserver",
		VERSION,
		[]string{},
		[]string{},
		[]string{},
		"S.render",
		make(map[string]string),
		"",
	}
	idxRoot := s.InitIdxRoot(root) //???
	//sand.InitCred(cred)
	addDataServer(uri, router, idxRoot) //TODO
	s.InitRouter(router)
	s.InitHome(root)
	s.Start(mode, port, router)

	return nil
}
