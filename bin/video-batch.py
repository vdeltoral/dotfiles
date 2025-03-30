#!/usr/bin/env python3

import sys
import subprocess
import os

import argparse

def download_video(url, prefix, audio_only):
    if prefix:
        output = '' + prefix + '-' '%(title)s.%(ext)s'
    else:
        output = '%(title)s.%(ext)s'
    try:
        command = ["yt-dlp", "--cookies-from-browser", "firefox", "--no-overwrites", "--output", output, url]
        if audio_only:
            command += ["-x", "--audio-format", "mp3"]
        subprocess.run(command, check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error running 'yt-dlp' for {url}: {e}")
        sys.exit(-1)

def process_url_file(fp, increment, audio_only):
    try:
        with open(fp, 'r') as opened_file:
            counter = 1
            for line in opened_file:
                if line.startswith("https"):
                    if increment:
                        download_video(line, f"{counter:03}", audio_only)
                    else:
                        download_video(line, None, audio_only)
                    counter += 1
    except Exception as e:
        print(e)
        sys.exit(-1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(prog="VideoBatch", description="Uses yt-dlp to download videos from a list.", epilog="Uses firefox for cookies.")
    parser.add_argument("filepath")
    parser.add_argument("-i", "--increment", action="store_true", help="If true adds an increment to the title. E.g. 01-apples.mp4 02-oranges.mp4")
    parser.add_argument("-a", "--audio_only", action="store_true", help="If true only downloads the audio.")
    args = parser.parse_args()
    if not os.path.isfile(args.filepath):
        print("Filepath must be a valid file")
        sys.exit(-1)

    process_url_file(args.filepath, args.increment, args.audio_only)
