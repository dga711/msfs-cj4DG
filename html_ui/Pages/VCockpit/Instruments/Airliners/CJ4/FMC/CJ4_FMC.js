class CJ4_FMC extends FMCMainDisplay {
    constructor() {
        super(...arguments);
        this._registered = false;
        this._isRouteActivated = false;
        this._lastUpdateAPTime = NaN;
        this.refreshFlightPlanCooldown = 0;
        this.updateAutopilotCooldown = 0;
        this._hasSwitchedToHoldOnTakeOff = false;
        this._previousApMasterStatus = false;
        this._apMasterStatus = false;
        this._apHasDeactivated = false;
        this._hasReachedTopOfDescent = false;
        this._apCooldown = 500;
        this._hasChanged = false;
    }
    get templateID() { return "CJ4_FMC"; }
    get hasChanged() { return this._hasChanged; }
    set hasChanged(value) {
        this._hasChanged = value;
        if (this._hasChanged) {
            let execEl = document.createElement("div");
            execEl.id = "exec-sign";
            execEl.innerHTML = "EXEC";
            execEl.classList.add("blackwhite", "line-right", "fitcontent");
            this.getChildById("Electricity").append(execEl);
        } else {
            let execEl = document.getElementById("exec-sign");
            if (execEl) execEl.remove();
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this.radioNav.init(NavMode.TWO_SLOTS);
        if (!this._registered) {
            RegisterViewListener("JS_LISTENER_KEYEVENT", () => {
                console.log("JS_LISTENER_KEYEVENT registered.");
                RegisterViewListener("JS_LISTENER_FACILITY", () => {
                    console.log("JS_LISTENER_FACILITY registered.");
                    this._registered = true;
                });
            });
        }
    }
    Init() {
        super.Init();
        this.maxCruiseFL = 450;
        this.onFplan = () => { CJ4_FMC_RoutePage.ShowPage1(this); };
        this.onLegs = () => { CJ4_FMC_LegsPage.ShowPage1(this); };
        this.onDepArr = () => { CJ4_FMC_DepArrPage.ShowPage1(this); };
        this.onDsplMenu = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(this); };
        this.onTun = () => { CJ4_FMC_NavRadioPage.ShowPage1(this); };
        this.onExec = () => {
            if (this.getIsRouteActivated()) {
                this.insertTemporaryFlightPlan();
                this._isRouteActivated = false;
                SimVar.SetSimVarValue("L:FMC_EXEC_ACTIVE", "number", 0);
                if (this.refreshPageCallback) {
                    this.refreshPageCallback();
                }
            }
            this.hasChanged = false;
        };

        // make footer accesible from css
        document.getElementById("in-out").parentElement.classList.add("footer");

        let inoutelem = document.getElementById("in-out");
        let brkOpen = document.createElement("span");
        brkOpen.innerHTML = "[";
        brkOpen.classList.add("blue", "line-left", "brk-left");
        let brkClose = document.createElement("span");
        brkClose.innerHTML = "]";
        brkClose.classList.add("blue", "line-right", "brk-right");
        inoutelem.parentElement.appendChild(brkOpen);
        inoutelem.parentElement.appendChild(brkClose);

        CJ4_FMC_IdentPage.ShowPage1(this);
    }
    Update() {
        super.Update();
        this.updateAutopilot();
    }
    onInputAircraftSpecific(input) {
        console.log("CJ4_FMC.onInputAircraftSpecific input = '" + input + "'");

        this.pageUpdate = undefined;
        document.getElementById("page-info").classList.remove("s-text");
        // reset header align
        document.getElementById("title").classList.remove("left");

        if (input === "LEGS") {
            if (this.onLegs) {
                this.onLegs();
            }
            return true;
        }
        if (input === "FPLN") {
            if (this.onFplan) {
                this.onFplan();
            }
            return true;
        }
        if (input === "DSPL_MENU") {
            if (this.onDsplMenu) {
                this.onDsplMenu();
            }
            return true;
        }
        if (input === "TUN") {
            if (this.onTun) {
                this.onTun();
            }
            return true;
        }
        if (input === "DIR") {
            CJ4_FMC_DirectToPage.ShowPage(this);
        }
        if (input === "EXEC") {
            if (this.onExec) {
                this.onExec();
            }
        }
        return false;
    }
    clearDisplay() {
        super.clearDisplay();
        this.onPrevPage = EmptyCallback.Void;
        this.onNextPage = EmptyCallback.Void;
    }
    getOrSelectWaypointByIdent(ident, callback) {
        this.dataManager.GetWaypointsByIdent(ident).then((waypoints) => {
            if (!waypoints || waypoints.length === 0) {
                return callback(undefined);
            }
            if (waypoints.length === 1) {
                return callback(waypoints[0]);
            }
            CJ4_FMC_SelectWptPage.ShowPage(this, waypoints, callback);
        });
    }
    updateSideButtonActiveStatus() {
    }
    getIsRouteActivated() {
        return this._isRouteActivated;
    }
    activateRoute() {
        this._isRouteActivated = true;
        SimVar.SetSimVarValue("L:FMC_EXEC_ACTIVE", "number", 1);
    }
    updateAutopilot() {
        let now = performance.now();
        let dt = now - this._lastUpdateAPTime;
        this._lastUpdateAPTime = now;
        if (isFinite(dt)) {
            this.updateAutopilotCooldown -= dt;
        }
        if (SimVar.GetSimVarValue("L:AIRLINER_FMC_FORCE_NEXT_UPDATE", "number") === 1) {
            SimVar.SetSimVarValue("L:AIRLINER_FMC_FORCE_NEXT_UPDATE", "number", 0);
            this.updateAutopilotCooldown = -1;
        }
        if (this.updateAutopilotCooldown < 0) {
            let currentApMasterStatus = SimVar.GetSimVarValue("AUTOPILOT MASTER", "boolean");
            if (currentApMasterStatus != this._apMasterStatus) {
                this._apMasterStatus = currentApMasterStatus;
            }
            this._apHasDeactivated = !currentApMasterStatus && this._previousApMasterStatus;
            this._previousApMasterStatus = currentApMasterStatus;
            let isVNAVActivate = SimVar.GetSimVarValue("L:XMLVAR_VNAVButtonValue", "boolean");
            let currentAltitude = Simplane.getAltitude();
            let groundSpeed = Simplane.getGroundSpeed();
            let apTargetAltitude = Simplane.getAutoPilotAltitudeLockValue("feet");
            let planeHeading = Simplane.getHeadingMagnetic();
            let planeCoordinates = new LatLong(SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude"), SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude"));
            if (isVNAVActivate) {
                let prevWaypoint = this.flightPlanManager.getPreviousActiveWaypoint();
                let nextWaypoint = this.flightPlanManager.getActiveWaypoint();
                if (nextWaypoint && (nextWaypoint.legAltitudeDescription === 3 || nextWaypoint.legAltitudeDescription === 4)) {
                    let targetAltitude = nextWaypoint.legAltitude1;
                    if (nextWaypoint.legAltitudeDescription === 4) {
                        targetAltitude = Math.max(nextWaypoint.legAltitude1, nextWaypoint.legAltitude2);
                    }
                    let showTopOfDescent = false;
                    let topOfDescentLat;
                    let topOfDescentLong;
                    this._hasReachedTopOfDescent = true;
                    if (currentAltitude > targetAltitude + 40) {
                        let vSpeed = 3000;
                        let descentDuration = Math.abs(targetAltitude - currentAltitude) / vSpeed / 60;
                        let descentDistance = descentDuration * groundSpeed;
                        let distanceToTarget = Avionics.Utils.computeGreatCircleDistance(prevWaypoint.infos.coordinates, nextWaypoint.infos.coordinates);
                        showTopOfDescent = true;
                        let f = 1 - descentDistance / distanceToTarget;
                        topOfDescentLat = Avionics.Utils.lerpAngle(planeCoordinates.lat, nextWaypoint.infos.lat, f);
                        topOfDescentLong = Avionics.Utils.lerpAngle(planeCoordinates.long, nextWaypoint.infos.long, f);
                        if (distanceToTarget + 1 > descentDistance) {
                            this._hasReachedTopOfDescent = false;
                        }
                    }
                    if (showTopOfDescent) {
                        SimVar.SetSimVarValue("L:AIRLINER_FMS_SHOW_TOP_DSCNT", "number", 1);
                        SimVar.SetSimVarValue("L:AIRLINER_FMS_LAT_TOP_DSCNT", "number", topOfDescentLat);
                        SimVar.SetSimVarValue("L:AIRLINER_FMS_LONG_TOP_DSCNT", "number", topOfDescentLong);
                    }
                    else {
                        SimVar.SetSimVarValue("L:AIRLINER_FMS_SHOW_TOP_DSCNT", "number", 0);
                    }
                    let altitude = Simplane.getAutoPilotSelectedAltitudeLockValue("feet");
                    let constraintRespected = false;
                    if (isFinite(nextWaypoint.legAltitude1) && altitude <= nextWaypoint.legAltitude1) {
                        if (this._hasReachedTopOfDescent) {
                            SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
                            Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, nextWaypoint.legAltitude1, true);
                            SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 1);
                            constraintRespected = true;
                        }
                    }
                    if (!constraintRespected) {
                        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 0);
                        SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 0);
                    }
                }
                else {
                    SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 0);
                    SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 0);
                }
            }
            if (!this.flightPlanManager.isActiveApproach()) {
                let activeWaypoint = this.flightPlanManager.getActiveWaypoint();
                let nextActiveWaypoint = this.flightPlanManager.getNextActiveWaypoint();
                if (activeWaypoint && nextActiveWaypoint) {
                    let pathAngle = nextActiveWaypoint.bearingInFP - activeWaypoint.bearingInFP;
                    while (pathAngle < 180) {
                        pathAngle += 360;
                    }
                    while (pathAngle > 180) {
                        pathAngle -= 360;
                    }
                    let absPathAngle = 180 - Math.abs(pathAngle);
                    let airspeed = Simplane.getIndicatedSpeed();
                    if (airspeed < 400) {
                        let turnRadius = airspeed * 360 / (1091 * 0.36 / airspeed) / 3600 / 2 / Math.PI;
                        let activateDistance = Math.pow(90 / absPathAngle, 1.6) * turnRadius * 1.2;
                        let distanceToActive = Avionics.Utils.computeGreatCircleDistance(planeCoordinates, activeWaypoint.infos.coordinates);
                        if (distanceToActive < activateDistance) {
                            this.flightPlanManager.setActiveWaypointIndex(this.flightPlanManager.getActiveWaypointIndex() + 1);
                        }
                    }
                }
            }
            SimVar.SetSimVarValue("SIMVAR_AUTOPILOT_AIRSPEED_MIN_CALCULATED", "knots", Simplane.getStallProtectionMinSpeed());
            SimVar.SetSimVarValue("SIMVAR_AUTOPILOT_AIRSPEED_MAX_CALCULATED", "knots", Simplane.getMaxSpeed(Aircraft.CJ4));
            this.updateAutopilotCooldown = this._apCooldown;
        }
    }
}
registerInstrument("cj4-fmc", CJ4_FMC);
//# sourceMappingURL=CJ4_FMC.js.map