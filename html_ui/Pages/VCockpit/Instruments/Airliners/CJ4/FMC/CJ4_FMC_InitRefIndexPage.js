class CJ4_FMC_InitRefIndexPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        fmc.setTemplate([
            ["INIT/REF INDEX"],
            [""],
            ["<STATUS", "NAV DATA>"],
            [""],
            ["<POS"],
            [""],
            ["<PERF"],
            [""],
            ["<THRUST LIM"],
            [""],
            ["<TAKEOFF"],
            [""],
            ["<APPROACH", "MAINT>"]
        ]);
        fmc.onLeftInput[0] = () => { CJ4_FMC_IdentPage.ShowPage1(fmc); };
        fmc.onLeftInput[1] = () => { CJ4_FMC_PosInitPage.ShowPage1(fmc); };
        fmc.onLeftInput[2] = () => { CJ4_FMC_PerfInitPage.ShowPage1(fmc); };
        fmc.onLeftInput[3] = () => { CJ4_FMC_ThrustLimPage.ShowPage1(fmc); };
        fmc.onLeftInput[4] = () => { CJ4_FMC_TakeOffRefPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}
//# sourceMappingURL=CJ4_FMC_InitRefIndexPage.js.map