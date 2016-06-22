$(function () {
    $('body').on('click', '#address_submit', function (e) {
        e.preventDefault();
        $('#address_modal').modal('hide');
        bundle.Main.addAddress($('#address_addr').val(), $('#address_pk').val());
    });
});
$(function () {
    $('body').on('click', '#create_backer_submit', function (e) {
        e.preventDefault();
        bundle.Main.createBackerTokens($('#create_backer_amount').val());
    });
});
$(function () {
    $('body').on('click', '#create_dollar_submit', function (e) {
        e.preventDefault();
        bundle.Main.createDollarTokens($('#create_dollar_amount').val());
    });
});
$(function () {
    $('body').on('click', '#redeem_backer_submit', function (e) {
        e.preventDefault();
        bundle.Main.redeemBackerTokens($('#redeem_backer_amount').val());
    });
});
$(function () {
    $('body').on('click', '#redeem_dollar_submit', function (e) {
        e.preventDefault();
        bundle.Main.redeemDollarTokens($('#redeem_dollar_amount').val());
    });
});
$(function () {
    $('body').on('click', '#transfer_backer_submit', function (e) {
        e.preventDefault();
        bundle.Main.transferBackerTokens($('#transfer_backer_address').val(), $('#transfer_backer_amount').val());
    });
});
$(function () {
    $('body').on('click', '#transfer_dollar_submit', function (e) {
        e.preventDefault();
        bundle.Main.transferDollarTokens($('#transfer_dollar_address').val(), $('#transfer_dollar_amount').val());
    });
});
$(function () {
    $('body').on('click', '#update_exchange_rate', function (e) {
        e.preventDefault();
        bundle.Main.updateExchangeRate();
    });
});
$(function() {
    $('#clear-log').click(function(){
        $('#notifications').empty();
    });
});
