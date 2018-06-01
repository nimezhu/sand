package main

import (
	"os"
	"path"

	"github.com/urfave/cli"
)

const (
	VERSION = "0.0.8"
)

func main() {
	app := cli.NewApp()
	app.Version = VERSION
	app.Name = "cnb data server"
	app.Usage = "cnbData start -i [[google_sheet_id]]"
	app.EnableBashCompletion = true //TODO
	app.Flags = []cli.Flag{
		cli.BoolFlag{
			Name:  "verbose",
			Usage: "Show more output",
		},
	}
	home := os.Getenv("HOME")
	app.Commands = []cli.Command{
		{
			Name:   "start",
			Usage:  "start an data server",
			Action: CmdStart,
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
					Name:  "root,r",
					Usage: "root directory",
					Value: path.Join(home, ".cnbData"),
				},
			},
		},
	}
	app.Run(os.Args)
}
