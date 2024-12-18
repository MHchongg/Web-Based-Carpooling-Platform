const nodemailer = require('nodemailer')
const voucher_codes = require('voucher-code-generator')
const QRCode = require('qrcode')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.APP_PASSWORD,
    },
})

const sendGeneralEmail = async (receiver_email, carpoolInfo, type) => {

    const emailInfo = {
        "JoinRequest": {
            "subject": "Someone request to join your carpool",
            "text": `${carpoolInfo.user_email} request to join your carpool ${carpoolInfo.carpool_title}`,
            "title": `${carpoolInfo.user_email} requests to join your carpool <span style="color: #f59816">${carpoolInfo.carpool_title}</span>`,
            "success_msg": `Request send successfully`
        },
        "AcceptRequest": {
            "subject": `Your join request has been accepted`,
            "text": `Your join request for carpool ${carpoolInfo.carpool_title} has been accepted`,
            "title": `Your request to join carpool <span style="color: #f59816">${carpoolInfo.carpool_title}</span>has been accepted`,
            "success_msg": 'Accept request successfully'
        },
        "RejectRequest": {
            "subject": `Your join request has been rejected`,
            "text": `Your join request for carpool ${carpoolInfo.carpool_title} has been rejected`,
            "title": `Your request to join carpool <span style="color: #f59816">${carpoolInfo.carpool_title}</span>has been rejected`,
            "success_msg": 'Reject request successfully'
        },
        "Exit": {
            "subject": `Someone exited your carpool`,
            "text": `${carpoolInfo.user_email} exited your carpool ${carpoolInfo.carpool_title}`,
            "title": `${carpoolInfo.user_email} have exited your carpool <span style="color: #f59816">${carpoolInfo.carpool_title}</span>`,
            "success_msg": "Exit carpool successfully"
        },
        "FormCarpool": {
            "subject": `Someone formed a carpool with you`,
            "text": `${carpoolInfo.user_email} formed a carpool ${carpoolInfo.carpool_title} with you`,
            "title": `${carpoolInfo.user_email} have formed the carpool <span style="color: #f59816">${carpoolInfo.carpool_title}</span>with you`,
            "success_msg": 'Form carpool successfully. You can refresh your page'
        },
        "Depart": {
            "subject": `Carpool departed!`,
            "text": `Your carpool ${carpoolInfo.carpool_title} has been started by the driver at ${carpoolInfo.nowDateTime}`,
            "title": `You carpool <span style="color: #f59816">${carpoolInfo.carpool_title}</span>has departed`,
            "nowDateTimeSection": `<p style="color: #5b277b; font-size: large; font-weight: bold;">Departure Time:</p><p>${carpoolInfo.nowDateTime}</p><br />`,
            "success_msg": "Carpool is departed"
        },
        "End": {
            "subject": `Carpool arrived!`,
            "text": `Your carpool ${carpoolInfo.carpool_title} has been ended by the driver at ${carpoolInfo.nowDateTime}`,
            "title": `Your carpool <span style="color: #f59816">${carpoolInfo.carpool_title}</span>has reached the destination`,
            "nowDateTimeSection": `<p style="color: #5b277b; font-size: large; font-weight: bold;">Arrival Time:</p><p>${carpoolInfo.nowDateTime}</p><br />`,
            "rateLinkSection": `<div style="width: 100%; display: flex; justify-content: center;">
                            <a href=${carpoolInfo.rateLink} id="rate-link">
                                Rate your members to build a more optimal user experience!!!
                            </a>
                        </div>`,
            "success_msg": 'Carpool has been ended'
        }
    }

    try {
        await transporter.sendMail({
            from: {
                name: "UniCarpool",
                address: "chongminghong34@gmail.com"
            },
            to: receiver_email, // list of receivers
            subject: emailInfo[type]["subject"], // Subject line
            text: emailInfo[type]["text"], // plain text body
            html: `
                <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

                <head>

                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta name="x-apple-disable-message-reformatting">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">

                <style type="text/css">
                    @media only screen and (min-width: 620px) {
                        .u-row {
                            width: 600px !important;
                        }

                        .u-row .u-col {
                            vertical-align: top;
                        }

                        .u-row .u-col-100 {
                            width: 600px !important;
                        }

                    }

                    @media (max-width: 620px) {
                        .u-row-container {
                            max-width: 100% !important;
                            padding-left: 0px !important;
                            padding-right: 0px !important;
                        }

                        .u-row .u-col {
                            min-width: 320px !important;
                            max-width: 100% !important;
                            display: block !important;
                        }

                        .u-row {
                            width: 100% !important;
                        }

                        .u-col {
                            width: 100% !important;
                        }

                        .u-col>div {
                            margin: 0 auto;
                        }
                    }

                    body {
                        margin: 0;
                        padding: 0;
                    }

                    table,
                    tr,
                    td {
                        vertical-align: top;
                        border-collapse: collapse;
                    }

                    p {
                        margin: 0;
                    }

                    .ie-container table,
                    .mso-container table {
                        table-layout: fixed;
                    }

                    * {
                        line-height: inherit;
                    }

                    a[x-apple-data-detectors='true'] {
                        color: inherit !important;
                        text-decoration: none !important;
                    }

                    table,
                    td {
                        color: #000000;
                    }

                    #rate-link {
                        transition: 0.3s;
                        color: white;
                        font-weight: bold;
                        border: 1px solid;
                        padding: 5px 10px 5px 10px;
                        background-color: #f59816;
                        text-decoration: none;
                        border-radius: 10px;
                        cursor: pointer;
                        text-align: center;
                    }

                    #rate-link:hover {
                        padding: 8px 13px 8px 13px !important;
                    }

                    @media (max-width: 480px) {
                        #u_content_heading_1 .v-container-padding-padding {
                            padding: 40px 30px 20px !important;
                        }

                        #u_content_heading_1 .v-font-size {
                            font-size: 28px !important;
                        }

                        #u_content_text_1 .v-container-padding-padding {
                            padding: 0px 10px 10px !important;
                        }

                        #u_content_text_2 .v-container-padding-padding {
                            padding: 10px 10px 20px !important;
                        }
                    }
                </style>

                <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,700&display=swap" rel="stylesheet" type="text/css">

                </head>

                <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #ecf0f1; color: #000000">

                <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #ecf0f1;width:100%" cellpadding="0" cellspacing="0">
                    <tbody>
                    <tr style="vertical-align: top">
                        <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">

                        <div class="u-row-container" style="padding: 0px;background-color: transparent">
                            <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                                <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                <div style="background-color: #ffffff;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                    <div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">

                                    <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                        <tr>
                                            <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">

                                            <h1 class="v-font-size" style="margin: 0px; line-height: 140%; text-align: center; word-wrap: break-word; font-family: 'Source Sans Pro',sans-serif; font-size: 30px; font-weight: 700;">
                                                <em style="color: #5b277b">UniCarpool</em></h1>
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>

                                    <table id="u_content_heading_1" style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                        <tr>
                                            <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:60px 150px 30px;font-family:arial,helvetica,sans-serif;" align="left">

                                            <h1 class="v-font-size" style="margin: 0px; line-height: 100%; text-align: center; word-wrap: break-word; font-size: 35px; font-weight: 400;">
                                                <strong>
                                                ${emailInfo[type]["title"]}
                                                </strong>
                                            </h1>
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>

                                    <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                        <tr>
                                            <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:0px;font-family:arial,helvetica,sans-serif;" align="left">

                                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                <td style="padding-right: 0px;padding-left: 0px;" align="center">

                                                    <img align="center" border="0" src="https://www.clipartbest.com/cliparts/RiA/B67/RiAB67axT.gif" alt="image" title="image" loading="lazy" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 100%;max-width: 600px;" width="600"; />
                                                </td>
                                                </tr>
                                            </table>
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>

                                    <table id="u_content_text_1" style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                        <tr>
                                            <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:0px 50px 10px;font-family:arial,helvetica,sans-serif;" align="left">

                                            <p style="color: #5b277b; font-size: large; font-weight: bold;">Pickup:</p>
                                            <p>
                                                ${carpoolInfo.carpool_from}
                                            </p>
                                            <br/>

                                            <p style="color: #5b277b; font-size: large; font-weight: bold;">Dropoff:</p>
                                            <p>
                                                ${carpoolInfo.carpool_to}
                                            </p>
                                            <br/>

                                            <p style="color: #5b277b; font-size: large; font-weight: bold;">Date Time:</p>
                                            <p>
                                                ${carpoolInfo.carpool_dateTime}
                                            </p>
                                            <br/>

                                            ${emailInfo[type]["nowDateTimeSection"] ?? ''}

                                            ${emailInfo[type]["rateLinkSection"] ?? ''}

                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                                    </div>
                                </div>
                                </div>
                            </div>
                            </div>
                        </div>

                        <div class="u-row-container" style="padding: 0px;background-color: transparent">
                            <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">

                                <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                <div style="background-color: #916baf;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">

                                    <div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">

                                    <table id="u_content_text_2" style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                        <tr>
                                            <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px 100px 30px;font-family:arial,helvetica,sans-serif;" align="left">

                                            <div class="v-font-size" style="font-family: 'Source Sans Pro',sans-serif; font-size: 23px; font-weight: 700; color: #ffffff; line-height: 170%; text-align: center; word-wrap: break-word;">
                                                <p style="font-size: 2rem; font-style: italic;">UniCarpool</p>
                                            </div>
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                                    </div>
                                </div>
                                </div>
                            </div>
                            </div>
                        </div>

                        <div class="u-row-container" style="padding: 0px;background-color: transparent">
                            <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                                <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                    <div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">

                                    <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                        <tr>
                                            <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">

                                            <div class="v-font-size"
                                                style="font-size: 14px; line-height: 140%; text-align: right; word-wrap: break-word;">
                                                <p style="line-height: 140%;">UniCarpool</p>
                                                <p style="line-height: 140%;">Bukit Beruang</p>
                                                <p style="line-height: 140%;">Melaka</p>
                                            </div>

                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                                    </div>
                                </div>
                                </div>
                            </div>
                            </div>
                        </div>
                        </td>
                    </tr>
                    </tbody>
                </table>
                </body>

                </html>
            `
        });
        return({ alert: true, status: true, msg: emailInfo[type]["success_msg"] })
    }
    catch (error) {
        console.log(error)
        return({ alert: true, status: false, msg: `Failed to send email (${type}): ${error}`})
    }
}

const sendRewardEmail = async (receiver_email, rewardInfo) => {
    try {
        const coupon_code = voucher_codes.generate({ length: 12, count: 1 })[0]
        const QRImg = await QRCode.toDataURL(coupon_code)

        // send mail with defined transport object
        await transporter.sendMail({
            from: {
                name: "UniCarpool",
                address: "chongminghong34@gmail.com"
            },
            to: receiver_email, // list of receivers
            subject: `Here is your reward`, // Subject line
            text: `You have redeemed reward ${rewardInfo["reward_title"]} using ${rewardInfo["reward_points"]} points`, // plain text body
            attachments: [{
                filename: 'reward-qr-code.png',
                content: QRImg.split(';base64,').pop(),
                encoding: 'base64'
            }],
            html: `
            <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

            <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="x-apple-disable-message-reformatting">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title></title>

            <style type="text/css">
                @media only screen and (min-width: 620px) {
                .u-row {
                    width: 600px !important;
                }

                .u-row .u-col {
                    vertical-align: top;
                }

                .u-row .u-col-100 {
                    width: 600px !important;
                }

                }

                @media (max-width: 620px) {
                    .u-row-container {
                        max-width: 100% !important;
                        padding-left: 0px !important;
                        padding-right: 0px !important;
                    }

                    .u-row .u-col {
                        min-width: 320px !important;
                        max-width: 100% !important;
                        display: block !important;
                    }

                    .u-row {
                        width: 100% !important;
                    }

                    .u-col {
                        width: 100% !important;
                    }

                    .u-col>div {
                        margin: 0 auto;
                    }
                }

                body {
                    margin: 0;
                    padding: 0;
                }

                table,
                tr,
                td {
                    vertical-align: top;
                    border-collapse: collapse;
                }

                p {
                    margin: 0;
                }

                * {
                    line-height: inherit;
                }

                table,
                td {
                    color: #000000;
                }

                @media (max-width: 480px) {
                    #u_content_heading_1 {
                        padding: 40px 10px 0px !important;
                    }

                    #u_content_heading_1 .v-font-size {
                        font-size: 24px !important;
                    }

                    #u_content_text_1{
                        padding: 5px 10px 10px !important;
                    }
                }
            </style>

            <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,700&display=swap" rel="stylesheet" type="text/css">
            <link href="https://fonts.googleapis.com/css?family=Playfair+Display:400,700&display=swap" rel="stylesheet" type="text/css">
            </head>

            <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #f2f2f2;color: #000000">
            <table id="u_body" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #f2f2f2;width:100%" cellpadding="0" cellspacing="0">
                <tbody>
                <tr style="vertical-align: top">
                    <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                    <div class="u-row-container" style="padding: 0px;background-color: transparent">
                        <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                        <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: white;">
                            <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                            <div style="height: 100%;width: 100% !important;">
                                <div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                <table id="u_content_heading_1" style="font-family:'Open Sans',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                    <tbody>
                                    <tr>
                                        <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;font-family:'Open Sans',sans-serif;" align="left">
                                        <h1 class="v-font-size" style="margin: 0px; color: #000000; line-height: 130%; text-align: center; word-wrap: break-word; font-family: 'Playfair Display',serif; font-size: 26px; font-weight: 400; margin-top: 1.5rem">
                                            <strong style="color: #ff9800; font-family:'Open Sans',sans-serif;">Here is your reward </strong>
                                            <br/>
                                            <strong style="color: #ff9800; font-family:'Open Sans',sans-serif;">${rewardInfo["reward_title"]}</strong>
                                        </h1>
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>

                                <table id="u_content_text_1" style="font-family:'Open Sans',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                    <tbody>
                                    <tr>
                                        <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:5px 50px 10px;font-family:'Open Sans',sans-serif;" align="left">
                                        <h3 style="margin-bottom: 0; color: #5b277b">Coupon code:</h3>
                                        <p>${coupon_code}</p>

                                        <h3 style="text-align: center; margin-bottom: 0; color: #5b277b">You can also get your QR code in the attachment.</h3>

                                        <div style="width: 100%;">
                                            <img style="position: relative; left: 25%" src="https://cliply.co/wp-content/uploads/2019/09/371907580_SPECIAL_GIFT_400px.gif" width="250" height="250" />
                                        </div>
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>

                    <div class="u-row-container" style="padding: 0px;background-color: transparent">
                        <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                        <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                            <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                            <div style="background-color: #916baf;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                <div style="box-sizing: border-box; height: 100%; padding: 10px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                <div class="v-font-size" style="font-family: 'Source Sans Pro',sans-serif; font-size: 23px; font-weight: 700; color: #ffffff; line-height: 170%; text-align: center; word-wrap: break-word;">
                                    <p style="font-size: 2rem; font-style: italic;">UniCarpool</p>
                                </div>
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>

                    <div class="u-row-container" style="padding: 0px;background-color: transparent">
                        <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                        <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                            <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                            <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                <div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0"
                                    cellspacing="0" width="100%" border="0">
                                    <tbody>
                                    <tr>
                                        <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
                                        <div class="v-font-size" style="font-size: 14px; line-height: 140%; text-align: right; word-wrap: break-word;">
                                            <p style="line-height: 140%;">UniCarpool</p>
                                            <p style="line-height: 140%;">Bukit Beruang</p>
                                            <p style="line-height: 140%;">Melaka</p>
                                        </div>
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                    </td>
                </tr>
                </tbody>
            </table>
            </body>

            </html>
        `
        });
        return ({ alert: true, status: true, msg: `Redeem successfully. Check your email` })
    }
    catch (error) {
        console.log(error)
        return({ alert: true, status: false, msg: `Failed to send reward email ${error}` })
    }
}

const sendInformEmail = async (receiver_email, emailInfo, user_name = "user") => {

    try {
        await transporter.sendMail({
            from: {
                name: "UniCarpool",
                address: "chongminghong34@gmail.com"
            },
            to: receiver_email, // list of receivers
            subject: emailInfo["subject"], // Subject line
            text: `${emailInfo["text"]} (${receiver_email})`, // plain text body
            html: `
                <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
                    <div style="margin:50px auto;width:70%;padding:20px 0">
                        <div style="border-bottom:1px solid #eee">
                            <p style="font-size:1.4em;color:#5b277b;font-weight:600;font-style:italic;">UniCarpool</p>
                        </div>
                        <p style="font-size:1.1em">Dear ${user_name},</p>
                            <br />
                            <p>${emailInfo["content"]}</p>
                            <br />
                            <p style="font-size:0.9em;">Regards,<br />UniCarpool</p>
                            <hr style="border:none;border-top:1px solid #eee" />
                            <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                                <p>UniCarpool</p>
                                <p>Bukit Beruang</p>
                                <p>Melaka</p>
                            </div>
                    </div>
                </div>`
        })
        return({ alert: true, status: true, msg: "" })
    }
    catch (error) {
        console.log(error)
        return ({ alert: true, status: false, msg: `Failed to send inform email: ${error}` })
    }
}

const sendOTPEmail = async (userEmail, OTP) => {
    try {
        // send mail with defined transport object
        await transporter.sendMail({
            from: {
                name: "UniCarpool",
                address: "chongminghong34@gmail.com"
            },
            to: userEmail, // list of receivers
            subject: "UniCarpool OTP Verification", // Subject line
            text: `Your OTP is ${OTP}`, // plain text body
            html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
            <div style="margin:50px auto;width:70%;padding:20px 0">
            <div style="border-bottom:1px solid #eee">
            <a href="" style="font-size:1.4em;color: #5b277b;text-decoration:none;font-weight:600">UniCarpool</a>
            </div>
            <p style="font-size:1.1em">Hi,</p>
            <p>Thank you for choosing UniCarpool. Use the following OTP to complete your Sign Up procedures. The OTP is valid for 1 minute.</p>
            <h2 style="background: #5b277b;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
            <p style="font-size:0.9em;">Regards,<br />UniCarpool</p>
            <hr style="border:none;border-top:1px solid #eee" />
            <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
            <p>UniCarpool</p>
            <p>Bukit Beruang</p>
            <p>Melaka</p>
            </div>
        </div>
        </div>`
        });
        return({ alert: true, status: true, msg: 'OTP has been send to your email' })
    }
    catch (error) {
        console.log(error)
        return ({ alert: true, status: false, msg: `Failed to send OTP: ${error}` })
    }
}

module.exports = {
    sendGeneralEmail,
    sendOTPEmail,
    sendRewardEmail,
    sendInformEmail,
}