package main

import (
	"os"

	"github.com/urfave/cli"
)

const (
	VERSION = "0.0.0"
)

func main() {
	app := cli.NewApp()
	app.Version = VERSION
	app.Name = "s2"
	app.Usage = "s2 tools"
	app.EnableBashCompletion = true //TODO
	app.Flags = []cli.Flag{
		cli.BoolFlag{
			Name:  "verbose",
			Usage: "Show more output",
		},
	}
	app.Commands = []cli.Command{
		{
			Name:   "app",
			Usage:  "start an application",
			Action: CmdApp,
			Flags: []cli.Flag{
				cli.StringFlag{
					Name:  "input,i",
					Usage: "input data tsv/xls/google sheet id",
					Value: "",
				},
				cli.IntFlag{
					Name:  "port,p",
					Usage: "data server port",
					Value: 8080,
				},
				cli.StringFlag{
					Name:  "mode,m",
					Usage: "start web or desktop application (w/d)",
					Value: "d",
				},
				cli.StringFlag{
					Name:  "root,r",
					Usage: "root directory",
					Value: "",
				},
				cli.StringFlag{
					Name:  "cred,c",
					Usage: "cred.json config file",
					Value: "./creds.json",
				},
			},
		},
	}
	app.Run(os.Args)
}
