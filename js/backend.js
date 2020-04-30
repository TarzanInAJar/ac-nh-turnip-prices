let user = null
let group = null
let current_island = 0

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

const fetchGroupInfo = async function () {
    let response = await fetch('group');
    if (response.ok) {
        return await response.json();
    }
}

const fetchGroupTurnips = async function (groupId) {
    return fetch('group/' + groupId + '/turnips')
        .then((response) => {
            return response.json()
        })
        .then((json) => {
            return json;
        })
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
const retrieveBackendInfo = async function () {
    try {
        await fetchUserInfo();
        if (user) {
            //first handle user
            let turnipWeek = await fetchUserTurnipWeek()
            if (turnipWeek) {
                user.turnips = previousFromTurnipWeek(turnipWeek)
            }
            // now groups
            let groups = await fetchGroupInfo()
            if (groups && groups.length > 0) {
                // only handle 1 group for now TODO Just remove multiple groups from backend
                group = groups[0]
                let groupTurnipWeeks = await fetchGroupTurnips(group.id)
                group.turnips = groupTurnipWeeks.map(async (week) => await previousFromTurnipWeek(week));
            }
        }
    } catch (e) {
        console.error("Error retrieving turnips from backend: ", e);
    }
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
