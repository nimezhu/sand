package main

import (
	"os"

	"github.com/urfave/cli"
)

const (
	VERSION = "0.0.8"
)

func main() {
	app := cli.NewApp()
	app.Version = VERSION
	app.Name = "cnb data server reverse proxy"
	app.Usage = "cnbDataRP start -i [[google_sheet_id]]"
	app.EnableBashCompletion = true //TODO
	app.Flags = []cli.Flag{
		cli.BoolFlag{
			Name:  "verbose",
			Usage: "Show more output",
		},
	}
	app.Commands = []cli.Command{
		{
			Name:   "start",
			Usage:  "start an data server reverse proxy",
			Action: CmdStart,
			Flags: []cli.Flag{
				cli.StringFlag{
					Name:  "input,i",
					Usage: "input data tsv/xls/google sheet id or proxy list tsv",
					Value: "",
				},
				cli.StringFlag{
					Name:  "title,t",
					Usage: "sheet title",
					Value: "Sheet1",
				},
				cli.IntFlag{
					Name:  "port,p",
					Usage: "data server port",
					Value: 8080,
				},
			},
		},
	}
	app.Run(os.Args)
}
