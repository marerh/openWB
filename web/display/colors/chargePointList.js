/** 
 * List the configured chargepoints and their key data
 * 
 */

class ChargePointList {

  constructor() {
    this.chargepoints = [];
    this.phaseSymbols = ['/', '\u2460', '\u2461', '\u2462']
    this.headers = ["Ladepunkt", "Ladeparameter", "geladen", "Ladestand"];
    this.chargeModes = ["Sofort", "Min & PV", "PV", "Stop", "Standby"]
    this.manualSoc = 0;
    this.tbody = null;
  };

  // initialize after document is created
  init() {
    this.cplist = d3.select("div#chargePointTable")
    this.fgColor = "var(--color-fg)";
  }

  // update if config has changed
  updateConfig() {
    this.calculateValues();
    this.cplist.selectAll("*").remove();
    const chargePoint = this.cplist
      .selectAll("rows")
      .data(this.chargepoints).enter()
      .append("div").attr("class", "container-fluid mt-3 p-0")
      ;
    chargePoint.html((row, index) => `
      <div class="row m-0 p-0" onclick="modeButtonClicked(${row.isEnabled},${index})">
        ${this.cpNameRow(row, index)}
      </div>
      <div class = "row m-0 p-0" onclick="modeButtonClicked(${row.isEnabled},${index})">
        ${this.cpChargeInfoRow(row, index)}
      </div>
      <div class = "row m-0 p-0">
        ${this.cpChargeModeRow(row, index)}
      </div>`
    )
    this.updateValues();
  }

  updateValues() { // A value has changed. Only update the values, do not redraw all
    //console.log(this.chargepoints)
    //console.log(wbdata)
    this.chargepoints.map((cp, i) => {
      let powerString = formatWatt(cp.power) + " " + this.phaseSymbols[cp.phasesInUse] + " " + cp.targetCurrent + " A";
      let energyString = formatWatt(cp.energy * 1000) + " / " + Math.round(cp.energy / cp.energyPer100km * 1000) / 10 + " km"
      if (cp.configured) {
        d3.select(".cpname-" + i).text(cp.name) // name
        if (cp.isSocConfigured) { // soc
          d3.select(".soctext-" + i).text(cp.soc + " %")
        } else {
          d3.select(".soctext-" + i).text(" ")
        }
        d3.select(".plugsymbol-" + i).classed("hide", !cp.isPluggedIn); // is plugged in
        d3.select(".plugsymbol-" + i).classed("text-green", cp.isCharging); // is charging
        d3.select(".plugsymbol-" + i).classed("text-orange", !cp.isCharging); // is not charging
        d3.select(".finishsymbol-" + i).classed("hide", !cp.willFinishAtTime); // charge for completion time
        d3.select(".nightsymbol-" + i).classed("hide", !cp.chargeAtNight); // charge at night
        d3.select(".powerstring-" + i).text(powerString); // power, phases, current
        d3.select(".energystring-" + i).text(energyString); // energy charged
        if (cp.isEnabled) {
          d3.select(".chargemode-" + i).text(this.chargeModes[wbdata.chargeMode]); // chargemode
        } else {
          d3.select(".chargemode-" + i).text("Inaktiv"); // disabled
        }
        d3.select(".chargemode-" + i).classed("text-red", !cp.isEnabled); // disabled
        d3.select(".chargemode-" + i).classed("text-white", cp.isEnabled); // enabled
        d3.select(".priority-" + i).classed("hide", !cp.isEnabled || !wbdata.isBatteryConfigured || (wbdata.chargeMode != "1" && wbdata.chargeMode != "2"))
        d3.select(".priority-" + i).classed("fa-car", wbdata.hasEVPriority); // car icon
        d3.select(".priority-" + i).classed("fa-car-battery", !wbdata.hasEVPriority); //battery icon
        d3.select("input#energyLimit").property("value", cp.energyToCharge); // Set the minimal Current for PV loading
        d3.select(".labelEnergyLimit").text(cp.energyToCharge + " kWh"); // Display the minimal Current for PV loading
        
      }
      // modal update
      // d3.select ("input#minCurrentMinPv").attr ("value", wbdata.minCurrent); // Set the minimal Current for PV loading in the range control
      // d3.select (".labelMinPv").text(wbdata.minCurrent + " A"); // Display the minimal Current for PV loading
    })
  }

  calculateValues() {
    this.chargepoints = wbdata.chargePoint.filter((cp, i) => cp.configured && i < 3); // limit number of charge points displayed to 3
  }

  cpNameRow(row, index) {
    return `
        <div class = "col px-0 py-0 chargePointName"
          style="color:${row.color};vertical-align:middle;text-align:left;">
          <span class="cpname-${index} px-0">${row.name}</span>
          <span class="plugsymbol-${index} fa fa-xs fa-plug hide"></span>
          <span class="finishsymbol-${index} fa fa-xs fa-flag-checkered pl-0 hide" style="color:${this.fgColor};"></span>
          <span class="nightsymbol-${index} fa fa-xs fa-moon pl-0" style="color:${this.fgColor};"></span>
        </div>
      `
  }

  cpChargeInfoRow(row, index) {
    let soctext = row.isSocConfigured ? row.soc + " %" : " ";
    return `
      <div class="col-4 px-0 py-0 chargePointName" style="color:${row.color};text-align:left">
        <span class="px-0 soctext-${index}" style="vertical-align:middle;">
          ${soctext}
        </span>
      </div>
      <div class="col-8  pl-0 pr-2 py-0 chargePointData" 
        style="color:white;vertical-align:middle;text-align:right;">
        <p class="powerstring-${index} px-0 pb-0 mb-0">
          ? W / ? A
        </p>
        <p class="energystring-${index} px-0 mb-0">
          ? kWh / ? km
        </p>
      </div>
      `
  }

  cpChargeModeRow(row, index) {
    return `
      <div class="col-7 m-0 px-0 py-0">
        <button class="btn btn-block btn-success display-button px-0 py-3" 
        type="button" onclick="modeButtonClicked(${index})">
          <span class="chargemode-${index}">Unknown</span>
          <span class="priority-${index} fas  px-2 hide"> </span>
        </button>
      </div>
      <div class="col-5 m-0 px-1 py-0">
        <button class="btn btn-block btn-outline-secondary display-button px-0 mx-0  py-3"
          type="button" onclick = "configButtonClicked(${index})">
          <i class="fas fa-wrench"></i>
        </button>
      </div>`
  }

  displayChargeConfigModal(index) {
    wbdata.chargePointToConfig = index; // remember the CP we are configuring
    d3.select(".configLp").text(index + 1); // Set the CP number in the title
    d3.select("input#minCurrentMinPv").property("value", wbdata.minCurrent); // Set the minimal Current for PV loading
    d3.select(".labelMinPv").text(wbdata.minCurrent + " A"); // Display the minimal Current for PV loading
    d3.select("input#currentSofort").property("value", wbdata.chargePoint[index].current); // Set the minimal Current for PV loading
    d3.select(".labelSofortCurrent").text(wbdata.chargePoint[index].current + " A"); // Display the minimal Current for PV loading
    d3.select("input#energyLimit").property("value", wbdata.chargePoint[index].energyToCharge); // Set the minimal Current for PV loading
    d3.select(".labelEnergyLimit").text(wbdata.chargePoint[index].energyToCharge + " kWh"); // Display the minimal Current for PV loading
    if (index < 2) {
      d3.select("input#socLimit").property("value", wbdata.chargePoint[index].socLimit); // Set the minimal Current for PV loading
      d3.select(".labelSocLimit").text(wbdata.chargePoint[index].socLimit + " %"); // Display the minimal Current for PV loading
      d3.select(".socConfiguredLp").classed("hide", false)
    } else {
      d3.select(".socConfiguredLp").classed("hide", true)
    }
    const noLimitButton = d3.select (".buttonNoLimit");
    const socLimitButton = d3.select (".buttonSocLimit");
    const energyLimitButton = d3.select (".buttonEnergyLimit");
    
    const limitMode =  wbdata.chargePoint[index].chargeLimitation;
    noLimitButton.classed("active", (limitMode == '0'));
    socLimitButton.classed("active", (limitMode == '2'));
    energyLimitButton.classed("active", (limitMode == '1'));
      
    
  }
}



function lpButtonClicked(i) {
  if (wbdata.chargePoint[i].isEnabled) {
    publish("0", "openWB/set/lp/" + (+i + 1) + "/ChargePointEnabled");
  } else {
    publish("1", "openWB/set/lp/" + (+i + 1) + "/ChargePointEnabled");
  }
  d3.select("button#lpbutton-" + i)
    .classed("disabled", true);
}

function lpButtonClicked(i) {
  if (wbdata.chargePoint[i].isEnabled) {
    publish("0", "openWB/set/lp/" + (+i + 1) + "/ChargePointEnabled");
  } else {
    publish("1", "openWB/set/lp/" + (+i + 1) + "/ChargePointEnabled");
  }
  d3.select("button#lpbutton-" + i)
    .classed("disabled", true);
}

function configButtonClicked(index) {
  if (displaylocked == false) {
    chargePointList.displayChargeConfigModal(index);

    // $('#ladepunktConfigModal').find('.configLp').text(index + 1);
    // $('#ladepunktConfigModal').find('[data-config-lp]').addClass('hide');
    // $('#ladepunktConfigModal').find('[data-config-lp="' + (index + 1) + '"]').removeClass('hide');
    $('#ladepunktConfigModal').modal("show");
  } else {
    $("#lockInfoModal").modal("show");
  }
}

function modeButtonClicked(index) {
  if (displaylocked == false) {
    let div = d3.select("div#disableButton").attr("class", "col-sm-4 px-3 pb-3 pt-1 modalLabel");
    div.selectAll("*").remove();
    let buttonText = (chargePointList.chargepoints[index].isEnabled ? "Deaktivieren" : "LP Aktivieren")
    let b = div.append("button")
      .attr("type", "button")
      .text(buttonText)
      .attr("class", " chargeModeBtn chargeModeBtnDisable btn btn-lg btn-block")
      .attr("data-dismiss", "modal")
      .on("click", () => {
        lpButtonClicked(index)
      })
    b.classed("btn-danger", chargePointList.chargepoints[index].isEnabled)
    b.classed("btn-info", !chargePointList.chargepoints[index].isEnabled)

    $("#chargeModeModal").modal("show");
  } else {
    $("#lockInfoModal").modal("show");
  }
}
var chargePointList = new ChargePointList();