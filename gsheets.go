package sand

/* gsheets is a general handler adapter for google sheet */

import (
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/nbrowser/sand/gsheets"
	"golang.org/x/oauth2"
)

func gsheetsAppend(w http.ResponseWriter, req *http.Request) {
	session, _ := store2.Get(req, sessionID)
	sheetid := req.URL.Query().Get("sheetid")
	sheet := req.URL.Query().Get("title")
	writeRange := req.URL.Query().Get("range")
	if writeRange != "" {
		writeRange = "A1"
	}
	if sheet != "" {
		writeRange = sheet + "!" + writeRange
	}
	token := &oauth2.Token{}
	err := json.Unmarshal(session.Values["token"].([]byte), token)
	if err != nil {
		log.Println(err)
	}
	/* req.Body is data in marshal json */
	all, _ := ioutil.ReadAll(req.Body)
	var d []interface{}
	err1 := json.Unmarshal(all, &d)
	n := randStringRunes(32) //TODO
	if err1 != nil {
		log.Println(err1, string(all))
		io.WriteString(w, "error in unmarsal")
		return
	}
	gsheets.Append(conf, token, sheetid, writeRange, d)
	defer req.Body.Close()
	io.WriteString(w, n) //TODO
}

func gsheetsGet(w http.ResponseWriter, req *http.Request) {
	session, _ := store2.Get(req, sessionID)
	sheet := req.URL.Query().Get("title")
	readRange := req.URL.Query().Get("range")
	if readRange == "" {
		readRange = "A-C"
	}
	if sheet != "" {
		readRange = sheet + "!" + readRange
	}
	sheetid := req.URL.Query().Get("sheetid")
	token := &oauth2.Token{}
	err := json.Unmarshal(session.Values["token"].([]byte), token)
	if err != nil {
		log.Println(err)
		return
	}
	values, err := gsheets.Get(conf, token, sheetid, readRange)
	if err == nil && len(values) > 0 {
		for _, row := range values {
			// Print columns A and E, which correspond to indices 0 and 4.
			for _, v := range row {
				fmt.Fprintf(w, "%s\t", v) //TODO print in nice way
			}
			fmt.Fprintf(w, "\n")
		}
	} else {
		fmt.Fprintf(w, "No data found.")
	}
}
func addGSheetsHandler(router *mux.Router) {
	router.Handle("/gsheets/append", checkAuth(checkToken(http.HandlerFunc(gsheetsAppend)))) //upload to sheet
	router.Handle("/gsheets/get", checkAuth(checkToken(http.HandlerFunc(gsheetsGet))))       //get sheet
}
