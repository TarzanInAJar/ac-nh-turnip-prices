let user = null

$.ajaxSetup({
    beforeSend : function(xhr, settings) {
        if (settings.type == 'POST' || settings.type == 'PUT'
            || settings.type == 'DELETE') {
            if (!(/^http:.*/.test(settings.url) || /^https:.*/
                .test(settings.url))) {
                // Only send the token to relative URLs i.e. locally.
                xhr.setRequestHeader("X-XSRF-TOKEN",
                    Cookies.get('XSRF-TOKEN'));
            }
        }
    }
});

const logout = function() {
    $.post("/logout", function() {
        $(".unauthenticated").show();
        $(".authenticated").hide();
        location.reload()
    })
    return true;
}

const fetchUserInfo = async function () {
    let response = await fetch('user');
    if (response.ok) {
        user = await response.json();
    }
}

const fetchUserTurnipWeek = async function () {
    return fetch('turnips')
        .then((response) => {
            return response.json()
        })
        .then((json) => {
            return json;
        })
}

const previousFromTurnipWeek = function (turnipWeek) {
    return [
        turnipWeek.firstBuy,
        turnipWeek.previousPattern,
        [
            turnipWeek.boughtFor,
            turnipWeek.boughtFor,
            turnipWeek.monAM,
            turnipWeek.monPM,
            turnipWeek.tueAM,
            turnipWeek.tuePM,
            turnipWeek.wedAM,
            turnipWeek.wedPM,
            turnipWeek.thuAM,
            turnipWeek.thuPM,
            turnipWeek.friAM,
            turnipWeek.friPM,
            turnipWeek.satAM,
            turnipWeek.satPM
        ]
    ]
}
const getPreviousFromBackend = async function () {
    let previous;
    try {
        await fetchUserInfo();
        if (user) {
            let turnipWeek = await fetchUserTurnipWeek()
            if (turnipWeek) {
                previous = previousFromTurnipWeek(turnipWeek)
            }
        }
    } catch (e) {
        console.error("Error retrieving turnips from backend: ", e);
    }
    return previous;
}

const sendToBackend = function (prices, first_buy, previous_pattern) {
    const body = {
        prices: prices,
        firstBuy: first_buy,
        previousPattern: previous_pattern
    }
    return $.ajax({
        url: 'turnips',
        type: 'PUT',
        data: JSON.stringify(body),
        dataType: "json",
        contentType: "application/json"
    });
}
