class CJ4_FMC_RoutePage {

    static ShowPage1(fmc) {
        fmc.clearDisplay();
        let originCell = "□□□□";
        if (fmc && fmc.flightPlanManager) {
            let origin = fmc.flightPlanManager.getOrigin();
            if (origin) {
                originCell = origin.ident;
            }
            else if (fmc.tmpOrigin) {
                originCell = fmc.tmpOrigin;
            }
        }
        fmc.onLeftInput[0] = () => {
            let value = fmc.inOut;
            fmc.clearUserInput();
            fmc.updateRouteOrigin(value, (result) => {
                if (result) {
                    fmc.hasChanged = true;
                    CJ4_FMC_RoutePage.ShowPage1(fmc);
                }
            });
        };
        let destinationCell = "□□□□";
        if (fmc && fmc.flightPlanManager) {
            let destination = fmc.flightPlanManager.getDestination();
            if (destination) {
                destinationCell = destination.ident;
            }
            else if (fmc.tmpDestination) {
                destinationCell = fmc.tmpDestination;
            }
        }
        fmc.onRightInput[0] = () => {
            let value = fmc.inOut;
            fmc.clearUserInput();
            fmc.updateRouteDestination(value, (result) => {
                if (result) {
                    fmc.hasChanged = true;
                    CJ4_FMC_RoutePage.ShowPage1(fmc);
                }
            });
        };

        let distCell = "----";
        if (fmc && fmc.flightPlanManager) {
            let origin = fmc.flightPlanManager.getOrigin();
            let dest = fmc.flightPlanManager.getDestination();
            if ((origin && origin.infos instanceof AirportInfo) && (dest && dest.infos instanceof AirportInfo)) {
                let dist = Avionics.Utils.computeGreatCircleDistance(origin.infos.coordinates, dest.infos.coordinates);
                distCell = String(Math.round(dist, 0));
            }
        }

        let flightNoCell = "--------";
        let flightNoValue = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string");
        if (flightNoValue) {
            flightNoCell = flightNoValue;
        }
        fmc.onRightInput[4] = () => {
            let value = fmc.inOut;
            fmc.clearUserInput();
            fmc.updateFlightNo(value, (result) => {
                if (result) {
                    CJ4_FMC_RoutePage.ShowPage1(fmc);
                }
            });
        };
        let coRouteCell = "--------";
        if (fmc.coRoute) {
            coRouteCell = fmc.coRoute;
        }
        fmc.onRightInput[1] = () => {
            let value = fmc.inOut;
            fmc.clearUserInput();
            fmc.updateCoRoute(value, (result) => {
                if (result) {
                    CJ4_FMC_RoutePage.ShowPage1(fmc);
                }
            });
        };
        let allRows = CJ4_FMC_RoutePage._GetAllRows(fmc);
        let pageCount = (Math.floor(allRows.rows.length / 4) + 2);
        let activateCell = "";
        if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
            if (!fmc.getIsRouteActivated()) {
                activateCell = "ACTIVATE>";
                fmc.onRightInput[5] = () => {
                    fmc.activateRoute();
                    CJ4_FMC_RoutePage.ShowPage1(fmc);
                };
            }
        }
        else {
            activateCell = "PERF INIT>";
            fmc.onRightInput[5] = () => {
                fmc.activateRoute();
                CJ4_FMC_PerfInitPage.ShowPage1(fmc);
            };
        }

        let actOrMod = (fmc.hasChanged ? "MOD" : "ACT");

        // pull title to the left
        document.getElementById("title").classList.add("left");
        // make some space
        document.querySelectorAll("div[class~='label']")[5].style.height = "30px"
        // make footer accesible from css
        document.getElementById("in-out").parentElement.classList.add("footer");

        fmc.setTemplate([
            [actOrMod + ' FPLN', "1", pageCount.toFixed(0)],
            ["ORIGIN", "DEST", "DIST"],
            [originCell, destinationCell, distCell],
            ["ROUTE", "ALTN"],
            ["----------", "----"],
            ["", "ORIG RWY"],
            [""],
            ["VIA", "TO"],
            ["-----", "-----"],
            ["----------------[color]blue", "FLT NO"],
            ["", flightNoCell],
            [""],
            ["<SEC FPLN", activateCell]
        ]);

        fmc.onRightInput[5] = () => {
            fmc.insertTemporaryFlightPlan(() => {
                CJ4_FMC_RoutePage.ShowPage1(fmc);
            });
        };
        fmc.onNextPage = () => {
            CJ4_FMC_RoutePage.ShowPage2(fmc);
        };

        fmc.pageUpdate = () => {
            // pull title to the left
            document.getElementById("title").classList.add("left");
        }
    }
    static ShowPage2(fmc, offset = 0, pendingAirway) {
        fmc.clearDisplay();
        let rows = [["----"], [""], [""], [""], [""]];
        let allRows = CJ4_FMC_RoutePage._GetAllRows(fmc);
        let page = (2 + (Math.floor(offset / 4)));
        let pageCount = (Math.floor(allRows.rows.length / 4) + 2);
        console.log(fmc.flightPlanManager.getEnRouteWaypoints());
        let showInput = false;
        for (let i = 0; i < rows.length; i++) {
            if (allRows.rows[i + offset]) {
                rows[i] = allRows.rows[i + offset];
                let fpIndex = allRows.fpIndexes[i + offset];
                fmc.onRightInput[i] = () => {
                    let value = fmc.inOut;
                    if (value === FMCMainDisplay.clrValue) {
                        fmc.clearUserInput();
                        fmc.removeWaypoint(fpIndex, () => {
                            CJ4_FMC_RoutePage.ShowPage2(fmc, offset);
                        });
                    }
                };
            }
            else if (!showInput) {
                showInput = true;
                if (!pendingAirway) {
                    rows[i] = ["-----", "-----"];
                    fmc.onRightInput[i] = async () => {
                        let value = fmc.inOut;
                        if (value.length > 0) {
                            fmc.clearUserInput();
                            fmc.insertWaypoint(value, fmc.flightPlanManager.getEnRouteWaypointsLastIndex() + 1, () => {
                                CJ4_FMC_RoutePage.ShowPage2(fmc, offset);
                            });
                        }
                    };
                    fmc.onLeftInput[i] = async () => {
                        let value = fmc.inOut;
                        if (value.length > 0) {
                            fmc.clearUserInput();
                            let lastWaypoint = fmc.flightPlanManager.getWaypoints()[fmc.flightPlanManager.getEnRouteWaypointsLastIndex()];
                            if (lastWaypoint.infos instanceof IntersectionInfo) {
                                let airway = lastWaypoint.infos.airways.find(a => { return a.name === value; });
                                if (airway) {
                                    CJ4_FMC_RoutePage.ShowPage2(fmc, offset, airway);
                                }
                                else {
                                    fmc.showErrorMessage("NOT IN DATABASE");
                                }
                            }
                        }
                    };
                }
                else {
                    rows[i] = [pendingAirway.name, "-----"];
                    fmc.onRightInput[i] = () => {
                        let value = fmc.inOut;
                        if (value.length > 0) {
                            fmc.clearUserInput();
                            fmc.insertWaypointsAlongAirway(value, fmc.flightPlanManager.getEnRouteWaypointsLastIndex() + 1, pendingAirway.name, (result) => {
                                if (result) {
                                    CJ4_FMC_RoutePage.ShowPage2(fmc, offset);
                                }
                            });
                        }
                    };
                    if (rows[i + 1]) {
                        rows[i + 1] = ["-----"];
                    }
                }
            }
        }
        fmc.onRightInput[5] = () => {
            fmc.insertTemporaryFlightPlan(() => {
                CJ4_FMC_RoutePage.ShowPage2(fmc, offset);
            });
        };
        let activateCell = "";
        if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
            if (!fmc.getIsRouteActivated()) {
                activateCell = "ACTIVATE>";
                fmc.onRightInput[5] = () => {
                    fmc.activateRoute();
                    CJ4_FMC_RoutePage.ShowPage1(fmc);
                };
            }
        }
        else {
            activateCell = "PERF INIT>";
            fmc.onRightInput[5] = () => {
                fmc.activateRoute();
                CJ4_FMC_PerfInitPage.ShowPage1(fmc);
            };
        }
        fmc.setTemplate([
            ["RTE 1", page.toFixed(0), pageCount.toFixed(0)],
            ["VIA", "TO"],
            rows[0],
            [""],
            rows[1],
            [""],
            rows[2],
            [""],
            rows[3],
            [""],
            rows[4],
            [""],
            ["<RTE 2", activateCell]
        ]);
        fmc.onPrevPage = () => {
            if (offset === 0) {
                CJ4_FMC_RoutePage.ShowPage1(fmc);
            }
            else {
                CJ4_FMC_RoutePage.ShowPage2(fmc, offset - 4);
            }
        };
        fmc.onNextPage = () => {
            if (offset + 4 < allRows.rows.length) {
                CJ4_FMC_RoutePage.ShowPage2(fmc, offset + 4);
            }
        };
    }
    static _GetAllRows(fmc) {
        let allRows = [];
        let allWaypoints = [];
        let allFPIndexes = [];
        let flightPlan = fmc.flightPlanManager;
        if (flightPlan) {
            let departure = flightPlan.getDeparture();
            if (departure) {
                let departureWaypoints = flightPlan.getDepartureWaypoints();
                let lastDepartureWaypoint = departureWaypoints[departureWaypoints.length - 1];
                if (lastDepartureWaypoint) {
                    allRows.push([departure.name, lastDepartureWaypoint.ident]);
                }
            }
            let fpIndexes = [];
            let routeWaypoints = flightPlan.getEnRouteWaypoints(fpIndexes);
            for (let i = 0; i < routeWaypoints.length; i++) {
                let prev = routeWaypoints[i - 1];
                let wp = routeWaypoints[i];
                let next = routeWaypoints[i + 1];
                if (wp) {
                    let prevAirway = IntersectionInfo.GetCommonAirway(prev, wp);
                    if (!prevAirway) {
                        allRows.push(["DIRECT", wp.ident]);
                        allWaypoints.push(wp);
                        allFPIndexes.push(fpIndexes[i]);
                    }
                    else {
                        allRows.push([prevAirway.name, wp.ident]);
                        allWaypoints.push(wp);
                        allFPIndexes.push(fpIndexes[i]);
                    }
                }
            }
        }
        return {
            rows: allRows,
            waypoints: allWaypoints,
            fpIndexes: allFPIndexes
        };
    }
}

//# sourceMappingURL=CJ4_FMC_RoutePage.js.map