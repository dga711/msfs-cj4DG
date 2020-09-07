class CJ4_FMC_IdentPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        let model = SimVar.GetSimVarValue("ATC MODEL", "string", "FMC");
        if (!model) {
            model = "unkn.";
        }

        const d = new Date();
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const hour = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        const day = String(d.getDay()).padStart(2, "0");
        const month = months[d.getMonth()];
        const year = String(d.getFullYear()).substring(2,4);
        fmc.setTemplate([
            ["STATUS"],
            ["NAV DATA", ""],
            ["N4VD4T4-42", ""],
            ["ACTIVE DATA BASE", ""],
            ["04MAY20 11JUN20", ""],
            ["SEC DATA BASE"],
            ["12AUG19 21OCT19"],
            ["UTC", "DATE"],
            [hour + ":" + minutes, day + month + year],
            ["PROGRAM"],
            ["SCID 832-0883-052", ""],
            ["----------------------"],
            ["<INDEX", "POS INIT>"]
        ]);

        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PosInitPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}
//# sourceMappingURL=CJ4_FMC_IdentPage.js.map