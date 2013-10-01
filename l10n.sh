#!/bin/bash
# ==================
# Extracts translation files from Nuxeo sources.
# 
# Notes
# - Before this can be used, clone the sources with `git clone git@github.com:nuxeo/nuxeo.git` + `./clone.py`
# - On old Nuxeo versions, encoding might be broken in French. This can be fixed manually with:
#     native2ascii -encoding ISO-8859-1 l10n/5.6.0/messages_fr.properties messages_fr.properties
# ==================

# Handle params

nuxeoSourcesFolder=${1}

if [ -z "$nuxeoSourcesFolder" ]
then
  echo "Usage: 'l10n.sh [NUXEO SOURCE FOLDER]'"
  echo "(First, make sure to use './clone.py [NUXEO VERSION]' from the Nuxeo sources root)"
  exit 0;
fi

# Init

nuxeoVersion=`git --git-dir="$nuxeoSourcesFolder/.git" rev-parse --abbrev-ref HEAD`
targetFolder="./l10n/$nuxeoVersion"

echo "Detected Nuxeo version: $nuxeoVersion"
read -p "Copy translations to $targetFolder (Y/n)? " reply

if [[ "$reply" =~ ^[Yy]?$ ]]
then
  rm -rf $targetFolder
  mkdir -p $targetFolder
else
  echo "Aborted."
  exit 0
fi

# Search and copy translation files

echo "Searching translations files..."

for translationFile in `find "$nuxeoSourcesFolder" -name messages*.properties`
do  
  translationFilename=$(basename "$translationFile")
  targetFile="./$targetFolder/$translationFilename"
  if [ "$translationFile" != "$targetFile" ]
  then
    echo "Copying: $translationFile"
    cat $translationFile >> "$targetFolder/$translationFilename"
  fi
done
