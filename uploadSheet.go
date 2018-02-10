package sand

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"time"

	sheets "google.golang.org/api/sheets/v4"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"

	"golang.org/x/oauth2"
)

var store2 = sessions.NewCookieStore([]byte("secret"))

type entry struct {
	Id   string `json:"id"`
	Note string `json:"note"`
	Data string `json:"data"`
}

var demo []entry

func uploadSheet(w http.ResponseWriter, req *http.Request) {
	session, _ := store2.Get(req, sessionId)
	sheet := req.URL.Query().Get("sheet")
	writeRange := "A1"
	if sheet != "" {
		writeRange = sheet + "!A1"
	}
	userStr := session.Values["user"]
	var user User
	if userStr != nil {
		json.Unmarshal([]byte(userStr.(string)), &user)
		fmt.Println(user.Email)
		fmt.Println(user.Sub)
	} else {
		fmt.Println("nobody")
	}
	token := &oauth2.Token{}
	err := json.Unmarshal(session.Values["token"].([]byte), token)
	if err != nil {
		log.Println(err)
	}
	all, _ := ioutil.ReadAll(req.Body)
	d := entry{}
	err1 := json.Unmarshal(all, &d)
	n := randStringRunes(32)
	if err1 != nil {
		log.Println(err1, string(all))
		io.WriteString(w, "error in unmarsal")
		return
	}
	//TODO
	ctx := context.Background()
	client := conf.Client(ctx, token)
	srv, err := sheets.New(client)
	if err != nil {
		log.Printf("Unable to retrieve Sheets Client %v", err)
	}
	var spreadsheetId string
	spreadsheetId, ok := userSheetIdMap[user.Email]
	if !ok {
		spreadsheetId = session.Values["sheetId"].(string)
	}
	var vr sheets.ValueRange
	log.Println(d.Id, d.Note)
	myval := []interface{}{d.Id, d.Note, d.Data} //TODO
	vr.Values = append(vr.Values, myval)
	_, err = srv.Spreadsheets.Values.Append(spreadsheetId, writeRange, &vr).ValueInputOption("RAW").Do()
	if err != nil {
		log.Printf("Unable to append data from sheet. %v", err)
	}
	defer req.Body.Close()
	io.WriteString(w, n) //TODO
}

func sheet(w http.ResponseWriter, req *http.Request) {
	session, _ := store2.Get(req, sessionId)
	userStr := session.Values["user"]
	idx := req.URL.Query().Get("idx")
	if idx == "" {
		idx = "1"
	}

	var user User
	if userStr != nil {
		json.Unmarshal([]byte(userStr.(string)), &user)
		fmt.Println(user.Email)
		fmt.Println(user.Sub)
	} else {
		fmt.Println("nobody")
	}
	token := &oauth2.Token{}
	err := json.Unmarshal(session.Values["token"].([]byte), token)
	//n := RandStringRunes(32)
	if err != nil {
		log.Println(err)
	}
	//TODO
	ctx := context.Background()
	client := conf.Client(ctx, token)
	srv, err := sheets.New(client)
	if err != nil {
		log.Printf("Unable to retrieve Sheets Client %v", err)
	}
	//spreadsheetId := "1sl7ZkGWKX3Sx2yNLPpYNwVhBklVMXucVs4Ht9ukKVhw" //TODO USER CHANGE SHEETID
	var spreadsheetId string
	spreadsheetId, ok := userSheetIdMap[user.Email]
	if !ok {
		spreadsheetId = session.Values["sheetId"].(string)
	}
	readRange := "C" + idx //TODO
	resp, err := srv.Spreadsheets.Values.Get(spreadsheetId, readRange).Do()
	if err != nil {
		log.Printf("Unable to retrieve data from sheet. %v", err)
	}

	if len(resp.Values) > 0 {
		for _, row := range resp.Values {
			// Print columns A and E, which correspond to indices 0 and 4.
			fmt.Fprintf(w, "%s\n", row[0])
		}
	} else {
		fmt.Print("No data found.")
	}
	//io.WriteString(w, n)
}

func sheetList(w http.ResponseWriter, req *http.Request) {
	session, _ := store2.Get(req, sessionId)
	userStr := session.Values["user"]
	var user User
	if userStr != nil {
		json.Unmarshal([]byte(userStr.(string)), &user)
	} else {
	}
	token := &oauth2.Token{}
	err := json.Unmarshal(session.Values["token"].([]byte), token)
	if err != nil {
		log.Println(err)
	}
	//TODO
	ctx := context.Background()
	client := conf.Client(ctx, token)
	srv, err := sheets.New(client)
	if err != nil {
		log.Printf("Unable to retrieve Sheets Client %v", err)
	}
	//spreadsheetId := "1sl7ZkGWKX3Sx2yNLPpYNwVhBklVMXucVs4Ht9ukKVhw" //TODO USER CHANGE SHEETID
	spreadsheetId, ok := userSheetIdMap[user.Email]
	if !ok {
		spreadsheetId = session.Values["sheetId"].(string)
	}
	readRange := "A:C"
	resp, err := srv.Spreadsheets.Values.Get(spreadsheetId, readRange).Do()
	if err != nil {
		log.Printf("Unable to retrieve data from sheet. %v", err)
	}

	if len(resp.Values) > 0 {
		j, err := json.Marshal(resp.Values)
		if err != nil {

		} else {
			w.Write(j)
		}
	} else {
		w.Write([]byte("{\"error\":\"No data found\"}"))
	}
}

func setSheetId(w http.ResponseWriter, r *http.Request) {
	session, _ := store2.Get(r, sessionId)
	id := r.URL.Query().Get("id")
	userStr := session.Values["user"]
	var user User
	if userStr != nil {
		err := json.Unmarshal([]byte(userStr.(string)), &user)
		//TODO Save To BoltDb and Google Sheet.
		if err == nil {
			userSheetIdMap[user.Email] = id
			sheetIdBucket.Put([]byte(user.Email), []byte(id))
			err2 := tx.Commit()
			if err2 != nil {
				log.Println("error in commit sheetid", err2)
			}
		}
	}
	session.Values["sheetId"] = id
	session.Save(r, w)
	w.Write([]byte(id))
}

func getSheetId(w http.ResponseWriter, r *http.Request) {
	session, _ := store2.Get(r, sessionId)
	userStr := session.Values["user"]
	var user User
	if userStr != nil {
		err := json.Unmarshal([]byte(userStr.(string)), &user)
		if err == nil {
			if v, ok := userSheetIdMap[user.Email]; ok {
				w.Write([]byte("{\"sheetid\":\"" + v + "\"}"))
			} else {
				w.Write([]byte("{\"error\":\"sheet id not set\"}"))
			}
		}
	}
}

func checkToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Our middleware logic goes here...
		session, _ := store2.Get(r, sessionId)
		token := &oauth2.Token{}
		err := json.Unmarshal(session.Values["token"].([]byte), token)
		//n := RandStringRunes(32)
		if err != nil {
			w.Write([]byte("{\"error\":\"token error\"}"))
			return
		}
		if token.Expiry.Before(time.Now()) {
			userStr := session.Values["user"]
			var user User
			json.Unmarshal([]byte(userStr.(string)), &user)
			token = renewToken(conf, token, user.Email)
			session.Values["token"], _ = json.Marshal(token)
			session.Save(r, w)
			next.ServeHTTP(w, r)
		} else {
			next.ServeHTTP(w, r)
		}
	})
}
func checkSheet(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Our middleware logic goes here...
		session, _ := store2.Get(r, sessionId)
		//sheetId := session.Values["sheetId"]
		userStr := session.Values["user"]
		var user User
		json.Unmarshal([]byte(userStr.(string)), &user)
		if _, ok := userSheetIdMap[user.Email]; ok {
			next.ServeHTTP(w, r)
		} else {
			w.Write([]byte("{\"error\":\"sheet id not set\"}"))
		}
	})
}
func addSheetTo(router *mux.Router) {
	router.Handle("/uploadsheet", checkAuth(checkToken(checkSheet(http.HandlerFunc(uploadSheet))))) //upload to sheet
	router.Handle("/setsheetid", checkAuth(checkToken(http.HandlerFunc(setSheetId))))
	router.Handle("/getsheetid", checkAuth(checkToken(http.HandlerFunc(getSheetId))))
	router.Handle("/sheet", checkAuth(checkToken(checkSheet(http.HandlerFunc(sheet)))))         //get sheet
	router.Handle("/sheetlist", checkAuth(checkToken(checkSheet(http.HandlerFunc(sheetList))))) //get sheet list
	router.Handle("/myadmin/token", addAdminHandler(tokenHandler()))
	router.Handle("/myadmin/sheetid", addAdminHandler(sheetidHandler()))
	router.Handle("/myadmin/cmd/getdemo", checkToken(addAdminHandler(getDemoHandler())))
	router.Handle("/demo", http.HandlerFunc(demoHandler))
}
func demoHandler(w http.ResponseWriter, r *http.Request) {
	idx := r.URL.Query().Get("idx")
	if idx == "" {
		idx = "1"
	}
	i, err := strconv.Atoi(idx)
	if err != nil {
		i = 1
	}
	if len(demo) >= i {
		w.Write([]byte(demo[i-1].Data))
	} else {
		w.Write([]byte("{error:\"out of boundary\"}"))
	}
}
func tokenHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		v, _ := json.Marshal(refreshTokenMap)
		w.Write(v)
	})
}
func sheetidHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		v, _ := json.Marshal(userSheetIdMap)
		w.Write(v)
	})
}
func getDemoHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sheetid := r.FormValue("sheetid")
		fmt.Println(sheetid)
		session, _ := store2.Get(r, sessionId)
		userStr := session.Values["user"]
		var user User
		if userStr != nil {
			json.Unmarshal([]byte(userStr.(string)), &user)
			fmt.Println(user.Email)
			fmt.Println(user.Sub)
		} else {
			fmt.Println("nobody")
		}
		token := &oauth2.Token{}
		err := json.Unmarshal(session.Values["token"].([]byte), token)
		if err != nil {
			log.Println(err)
		}
		//TODO
		ctx := context.Background()
		client := conf.Client(ctx, token)
		srv, err := sheets.New(client)
		if err != nil {
			log.Printf("Unable to retrieve Sheets Client %v", err)
		}
		readRange := "A:C"
		resp, err := srv.Spreadsheets.Values.Get(sheetid, readRange).Do()
		if err != nil {
			log.Printf("Unable to retrieve data from sheet. %v", err)
		}
		demo = make([]entry, len(resp.Values))
		for i, v := range resp.Values {
			log.Println(i, v[0])
			demo[i] = entry{v[0].(string), v[1].(string), v[2].(string)}
		}
	})
}
