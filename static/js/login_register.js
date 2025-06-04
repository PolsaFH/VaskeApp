function nextStep(div) {
    for (let i = 0; i < document.getElementsByClassName("step").length; i++) {
        document.getElementsByClassName("step")[i].style.display = "none";
    }

    document.getElementById(div).style.display = "block";

}