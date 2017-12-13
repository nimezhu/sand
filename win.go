package sand

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path"
	"strconv"
	"strings"
	"time"

	observable "github.com/GianlucaGuarini/go-observable"
	astilectron "github.com/asticode/go-astilectron"
	astilog "github.com/asticode/go-astilog"
	"github.com/gorilla/mux"
	"github.com/pkg/errors"
)

func (s *Sand) newApp(name string) (*astilectron.Astilectron, error) {
	var a *astilectron.Astilectron
	var err error
	if a, err = astilectron.New(astilectron.Options{
		AppName:           name,
		BaseDirectoryPath: path.Join(s.Root, "lib"),
	}); err != nil {
		astilog.Fatal(errors.Wrap(err, "creating new astilectron failed"))
		return nil, errors.Wrap(err, "creating new astilectron failed")
	}
	a.HandleSignals()
	a.On(astilectron.EventNameAppClose, func(e astilectron.Event) (deleteListener bool) {
		a.Stop()
		return
	})
	// Start
	if err = a.Start(); err != nil {
		astilog.Fatal(errors.Wrap(err, "starting failed"))
	}

	return a, err
}

func closeAll(ws map[int]*astilectron.Window) {
	keys := []int{}
	for k := range ws {
		if k == -1 {
			continue
		}
		keys = append(keys, k)
	}
	for i := 0; i < len(keys); i++ {
		go func(j int) {
			ws[keys[j]].Close()
		}(i)
	}
	return
}

func generateLinks(port int, name string, app map[string]string) string {
	url := fmt.Sprintf("http://127.0.0.1:%d/v1/%s.html?", port, name)
	for k, v := range app {
		url += k + "=" + v + "&"
	}
	url = strings.Trim(url, "?")
	url = strings.Trim(url, "&")
	//fmt.Println("url", url)
	return url
}

func createNewWindow(a *astilectron.Astilectron, port int, width int, height int, page string, ws map[int]*astilectron.Window, idx int, app map[string]string, ch chan map[string]interface{}, o *observable.Observable) {
	var w1 *astilectron.Window
	var err error
	var id int
	id = idx
	log.Println("create ", id)
	if w1, err = a.NewWindow(generateLinks(port, page, app), &astilectron.WindowOptions{
		Center: astilectron.PtrBool(true),
		Icon:   astilectron.PtrStr(os.Getenv("GOPATH") + "/src/github.com/asticode/go-astilectron/examples/6.icons/gopher.png"),
		Height: astilectron.PtrInt(height),
		Width:  astilectron.PtrInt(width),
	}); err != nil {
		astilog.Fatal(errors.Wrap(err, "new window failed"))
	}
	if err := w1.Create(); err != nil {
		astilog.Fatal(errors.Wrap(err, "creating window failed"))
	}
	m := w1.NewMenu([]*astilectron.MenuItemOptions{
		{
			Label: astilectron.PtrStr("View"),
			SubMenu: []*astilectron.MenuItemOptions{
				{Label: astilectron.PtrStr("DevTools"), Role: astilectron.MenuItemRoleToggleDevTools},
			},
		},
	})
	m.Create()
	//w1.On()
	k, err := json.Marshal(app)
	if err != nil {
		log.Println("error", err)
	} else {
		log.Println("send window app var", string(k))
		w1.SendMessage("app " + string(k))
	}
	w1.On(astilectron.EventNameWindowEventResize, func(e astilectron.Event) (deleteListener bool) {
		astilog.Info("w1 Window resize")
		//w1.SendMessage("w1 resize") // TODO
		log.Println("resize", id)
		return
	})
	w1.On(astilectron.EventNameWindowEventClosed, func(e astilectron.Event) (deleteListener bool) {
		log.Println("delete", id)
		delete(ws, id)
		return
	})

	//TODO id increase .
	ws[id] = w1

	/* ext window EVENTS to server */
	w1.OnMessage(func(e *astilectron.EventMessage) interface{} {
		var m string
		e.Unmarshal(&m)
		//log.Println("get for w message")
		//log.Println(m)
		astilog.Infof("Received message %s", m)
		var dat map[string]interface{}
		if err := json.Unmarshal([]byte(m), &dat); err != nil {
			panic(err)
		}
		o.Trigger(dat["code"].(string), dat)
		return nil
	})
	time.Sleep(time.Second)

}
func menu(a *astilectron.Astilectron) *astilectron.Menu {
	var m = a.NewMenu([]*astilectron.MenuItemOptions{
		{
			Label: astilectron.PtrStr("Admin"),
			SubMenu: []*astilectron.MenuItemOptions{
				// {Label: astilectron.PtrStr("Data Manager")},
				// {Label: astilectron.PtrStr("Add External Window")},
				//{Label: astilectron.PtrStr("Add Window From Server")},
				{Label: astilectron.PtrStr("Quit"), Role: astilectron.MenuItemRoleClose},
				{Type: astilectron.MenuItemTypeSeparator},
				{Label: astilectron.PtrStr("About"), Role: astilectron.MenuItemRoleAbout},
			},
		},
		{
			Label: astilectron.PtrStr("View"),
			SubMenu: []*astilectron.MenuItemOptions{
				{Label: astilectron.PtrStr("Refresh")},
				{Label: astilectron.PtrStr("DevTools"), Role: astilectron.MenuItemRoleToggleDevTools},
				{Label: astilectron.PtrStr("Minimize"), Role: astilectron.MenuItemRoleMinimize},
				{Label: astilectron.PtrStr("Close"), Role: astilectron.MenuItemRoleClose},
			},
		},
	})
	return m
}
func assignId(ws map[int]*astilectron.Window) int {
	i := 100
	for _, ok := ws[i]; ok; i++ {
		_, ok = ws[i+1]
	}
	return i
}

func (s *Sand) startAstilectron(port int, router *mux.Router) error {
	log.Print("start app")
	ch := make(chan map[string]interface{})
	var w *astilectron.Window
	var err error

	/* add Socket */
	// chatroom := "scope"

	a, _ := s.newApp("CNB")
	defer a.Close()
	if w, err = a.NewWindow(fmt.Sprintf("http://127.0.0.1:%d/v1/main.html?mode=app", port), &astilectron.WindowOptions{
		Center: astilectron.PtrBool(true),
		Height: astilectron.PtrInt(618),
		Width:  astilectron.PtrInt(1000),
	}); err != nil {
		astilog.Fatal(errors.Wrap(err, "new window failed"))
	}
	if err = w.Create(); err != nil {
		astilog.Fatal(errors.Wrap(err, "creating window failed"))
	}

	var m = menu(a)
	miRefresh, _ := m.Item(1, 0)
	if err = m.Create(); err != nil {
		astilog.Fatal(errors.Wrap(err, "creating app menu failed"))
	}
	ws := make(map[int]*astilectron.Window)
	miRefresh.On(astilectron.EventNameMenuItemEventClicked, func(e astilectron.Event) bool {
		closeAll(ws)
		w.Session.ClearCache()
		w.SendMessage("refresh")
		return false
	})

	// wsVars := make(map[int]map[string]string)
	app := make(map[string]string)

	w.On(astilectron.EventNameWindowEventResize, func(e astilectron.Event) (deleteListener bool) {
		w.SendMessage("resize")
		return
	})
	/** START OF CODES */
	o := observable.New()
	chatroom := "Scope" //TODO
	addSocket(chatroom, router, w, o)

	// window send message to server
	w.OnMessage(func(e *astilectron.EventMessage) interface{} {
		var m string
		e.Unmarshal(&m)
		//log.Println("get for w message")
		//log.Println(m)
		astilog.Infof("Received message %s", m)
		var dat map[string]interface{}
		if err := json.Unmarshal([]byte(m), &dat); err != nil {
			panic(err)
		}
		o.Trigger(dat["code"].(string), dat)
		return nil
	})

	o.On("app", func(dat map[string]interface{}) {
		for k, v := range dat["data"].(map[string]interface{}) {
			app[k] = v.(string)
		}
	})

	/* w ask for states */
	o.On("getStates", func(dat map[string]interface{}) {
		log.Println("debug in getStates", dat)
		go func() {
			m := make(map[int]string)
			for k := range ws {
				if k != 0 { //skip data manager window
					a := <-ch
					fmt.Println("get id", a["sender"])
					d, _ := a["data"].(string)
					id, _ := a["sender"].(int)
					m[id] = d
					log.Println(a)
				}
			}
			c, _ := json.Marshal(m)
			//TODO  c2, _ := json.Marshal(wsVars)
			ms := map[string]string{
				"states": string(c),
				//TODO "vars":   string(c2),
			}
			msg, err := json.Marshal(ms)
			if err == nil {
				fmt.Println("aha")
				fmt.Println(ms)
				w.SendMessage("states " + string(msg)) //return ext states to main window
			} else {
				w.SendMessage("error codingExtStates")
			}
		}()
		log.Println(ws)
		for k, w0 := range ws {
			log.Println("getState", k)
			if k != 0 { //skip data manager for now.
				w0.SendMessage("getState {}") //TODO
			}
		}
	})

	o.On("readFile", func(dat map[string]interface{}) {
		content, err := ioutil.ReadFile(dat["data"].(string))
		if err == nil {
			s := "file " + string(content)
			//log.Println(s)
			w.SendMessage(s)
		} else {
			w.SendMessage("file null")
		}
	})
	/** TODO  Ext **/
	o.On("openExt", func(dat map[string]interface{}) {
		fmt.Println("openExt", dat)
		for k, v := range dat["data"].(map[string]interface{}) {
			app[k] = v.(string)
		}
		// app["regions"] = regions
		app["mode"] = "app"
		app["win"] = "ext"
		id := assignId(ws)
		go createNewWindow(a, port, 1000, 618, "main", ws, id, app, ch, o)
	})

	o.On("closeExt", func(dat map[string]interface{}) {
		closeAll(ws)
	})

	o.On("message", func(dat map[string]interface{}) {
		var s string
		if d, ok := dat["data"].(string); ok {
			s = "message " + d
		} else {
			data := dat["data"].(map[string]interface{})
			k, err := json.Marshal(data)
			if err == nil {
				s = "message " + string(k)
			}
		}
		for k, w := range ws {
			if k != 0 { //skip data manager window
				w.SendMessage(s)
			}
		}
		w.SendMessage(s)
	})

	o.On("createExt", func(dat map[string]interface{}) {
		var ida int
		fmt.Println("in Create Ext")
		if d, ok := dat["id"]; ok {
			ida, _ = strconv.Atoi(d.(string))
		} else {
			ida = assignId(ws)
		}
		go func(id int) {
			vars := make(map[string]string)
			for k, v := range app {
				vars[k] = v
			}
			if d, ok := dat["vars"]; ok {
				for k, v := range d.(map[string]interface{}) {
					vars[k] = v.(string)
				}
			}
			//vars["regions"] = regions //TODO
			createNewWindow(a, port, 1000, 618, "main", ws, id, vars, ch, o)
			/* TODO
			v := map[string]string{
				"code": "setState",
				"data": dat["data"].(string),
			}
			c, _ := json.Marshal(v)
			*/
			s := "setState " + dat["data"].(string)
			ws[id].SendMessage(s)
		}(ida)
	})
	w.On(astilectron.EventNameWindowEventClosed, func(e astilectron.Event) (deleteListener bool) {
		closeAll(ws)
		return
	})

	a.On(astilectron.EventNameAppCmdStop, func(e astilectron.Event) bool {
		s.handleInterrupt()
		return false
	})

	a.Wait()
	return nil
}
