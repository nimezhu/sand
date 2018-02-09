package gsheets

import (
	"context"
	"log"

	"golang.org/x/oauth2"
	sheets "google.golang.org/api/sheets/v4"
)

func Append(conf *oauth2.Config, token *oauth2.Token, sheetid string, writeRange string, data []interface{}) error {
	ctx := context.Background()
	client := conf.Client(ctx, token)
	srv, err := sheets.New(client)
	if err != nil {
		log.Printf("Unable to retrieve Sheets Client %v", err)
		return err
	}
	var vr sheets.ValueRange
	vr.Values = append(vr.Values, data)
	_, err = srv.Spreadsheets.Values.Append(sheetid, writeRange, &vr).ValueInputOption("RAW").Do()
	if err != nil {
		log.Printf("Unable to append data from sheet. %v", err)
		return err
	}
	return nil
}

func Get(conf *oauth2.Config, token *oauth2.Token, sheetid string, readRange string) ([][]interface{}, error) {
	ctx := context.Background()
	client := conf.Client(ctx, token)
	srv, err := sheets.New(client)
	if err != nil {
		log.Printf("Unable to retrieve Sheets Client %v", err)
		return nil, err
	}
	resp, err := srv.Spreadsheets.Values.Get(sheetid, readRange).Do()
	if err != nil {
		log.Printf("Unable to retrieve data from sheet. %v", err)
		return nil, err
	}
	return resp.Values, nil
}
