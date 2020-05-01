let user = null
let group = null
let current_island = null
let choose_island_radios = [];

$.ajaxSetup({
    beforeSend: function (xhr, settings) {
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

const logout = function () {
    $.post("/logout", function () {
        $(".unauthenticated").show();
        $(".authenticated").hide();
        $("#choose-island").hide()
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
            current_island = user.id
            let turnipWeek = await fetchUserTurnipWeek()
            if (turnipWeek) {
                user.turnips = previousFromTurnipWeek(turnipWeek)
            }
            // now groups
            let groups = await fetchGroupInfo()
            if (groups && groups.length > 0) {
                // only handle 1 group for now TODO Just remove multiple groups from backend
                let firstGroup = groups[0]
                if (Object.keys(firstGroup.members).length > 1) {
                    group = firstGroup
                    let groupTurnipWeeks = await fetchGroupTurnips(group.id)
                    let groupTurnips = {}
                    groupTurnipWeeks.forEach((week) => {
                        groupTurnips[week.userId] = previousFromTurnipWeek(week);
                        createIslandToggle(week)
                    })
                    choose_island_radios = getChooseIslandRadios()
                    group.turnips = groupTurnips
                }
            }
        }
    } catch (e) {
        console.error("Error retrieving turnips from backend: ", e);
    }
}

const createIslandToggle = function (week) {
    let newRadio = document.createElement("input");
    newRadio.type = "radio"
    newRadio.name = "choose-island"
    newRadio.value = week.userId
    let newLabel = document.createElement("label")
    newLabel.innerHTML = week.userName
    // is this you?
    if (week.userId === user.id) {
        newRadio.id = "choose-island-radio-yours"
        newRadio.checked = true
        newLabel.innerHTML += " (You!)"
    } else {
        newRadio.id = "choose-island-radio-" + week.userId
    }
    newLabel.setAttribute("for", newRadio.id)
    $("#choose-island-wrapper").append(newRadio, newLabel);
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

const getPreviousFromBackend = function () {
    if (user) {
        if (current_island === user.id) {
            $("#input-form :input").prop('disabled', false)
            $("#input-form").fadeTo('fast', 1)
            return user.turnips
        } else {
            $("#input-form :input").prop('disabled', true)
            $("#input-form").fadeTo('fast', .6)
            return group.turnips[current_island]
        }
    }
}

const switchIslandIfNecessary = function () {
    if (group) {
        const selected_island = parseInt(getCheckedRadio(choose_island_radios));
        if (current_island !== selected_island) {
            console.log('island changed')
            current_island = selected_island
            const previous = getPrevious()
            loadPrevious(previous)
        }
    }
}

const getChooseIslandRadios = function () {
    let radios = $('input[type = radio][name="choose-island"]')
    return radios.toArray();
}
