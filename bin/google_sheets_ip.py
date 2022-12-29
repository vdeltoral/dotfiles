# https://developers.google.com/sheets/api/quickstart/python

from __future__ import print_function

import socket
import os.path
import uuid
import sys
from datetime import datetime

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

user_bin_dir = os.path.join(os.path.expanduser("~"), "bin")
sys.path.append(user_bin_dir)

from publicip import get_public_ip
from localip import get_local_ip

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

SHEET_ID = "1yLnnszwu0fiC-x2ki2m_BZwekRcloTrG6qHLOnfv4pk"


def get_token_filepath():
    return os.path.join(os.path.expanduser("~"), ".google-sheets-token.json")


def get_creds_filepath():
    return os.path.join(os.path.expanduser("~"), ".google-sheets-credentials.json")


def get_sheet_range():
    hostname = socket.gethostname()
    if "AIR" in hostname:
        row_num = 2
    else:
        row_num = 3

    return f"IPs!A{row_num}:E{row_num}"


def get_creds():
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    creds_path = get_creds_filepath()
    token_path = get_token_filepath()
    creds = None
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(creds_path, SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open(token_path, "w") as token:
            token.write(creds.to_json())

    return creds


def get_sheet_values():
    """Shows basic usage of the Sheets API.
    Prints values from a sample spreadsheet.
    """
    sheet_range = "IPs!A1:E1"

    creds = get_creds()

    try:
        service = build("sheets", "v4", credentials=creds)

        # Call the Sheets API
        sheet = service.spreadsheets()
        result = sheet.values().get(spreadsheetId=SHEET_ID, range=sheet_range).execute()
        values = result.get("values", [])

        if not values:
            print("No data found.")
            return

        for row in values:
            print(row)
    except HttpError as err:
        print(err)


def update_sheet_values(row_values):
    creds = get_creds()

    sheet_range = get_sheet_range()

    try:

        service = build("sheets", "v4", credentials=creds)
        body = {"values": [row_values]}
        result = (
            service.spreadsheets()
            .values()
            .update(
                spreadsheetId=SHEET_ID,
                range=sheet_range,
                valueInputOption="USER_ENTERED",
                body=body,
            )
            .execute()
        )
        # print(f"{result.get('updatedCells')} cells updated.")
        return result
    except HttpError as error:
        print(f"An error occurred: {error}")
        return error


def prepare_row():
    hostname = socket.gethostname()
    mac_addr = ":".join(
        ["{:02x}".format((uuid.getnode() >> ele) & 0xFF) for ele in range(0, 8 * 6, 8)][
            ::-1
        ]
    )
    public_ip = get_public_ip()
    local_ip = get_local_ip()
    curr_time = str(datetime.now())
    row = (hostname, mac_addr, public_ip, local_ip, curr_time)
    # print(row)
    return row


if __name__ == "__main__":
    get_sheet_values()
    row_values = prepare_row()
    update_sheet_values(row_values)
