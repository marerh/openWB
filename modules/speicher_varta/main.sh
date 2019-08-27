#!/bin/bash

#Auslesen eines Varta Speicher über die integrierte XML-API der Batteroe.
. /var/www/html/openWB/openwb.conf


speicherwatt=$(curl --connect-timeout 5 -s "$vartaspeicherip/cgi/ems_data.xml" | grep 'P' | sed 's/.*value=//' |tr -d "'/>")
#wenn WR aus bzw. im standby (keine Antwort) ersetze leeren Wert durch eine 0
ra='^-?[0-9]+$'
if ! [[ $speicherwatt =~ $ra ]] ; then
	echo $speicherwatt > /var/www/html/openWB/ramdisk/speicherleistung
fi
	echo $speicherwatt > /var/www/html/openWB/ramdisk/speicherleistung
speichersoc=$(curl --connect-timeout 5 -s "$vartaspeicherip/cgi/ems_data.xml" | grep 'SOC' | sed 's/.*value=//' |tr -d "'/>")
if [[ $speichersoc =~ $ra ]] ; then
	echo $speichersoc > /var/www/html/openWB/ramdisk/speichersoc
fi



