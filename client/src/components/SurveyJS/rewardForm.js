export const rewardForm = {
    "pages": [
        {
            "name": "reward-details",
            "elements": [
                {
                    "type": "text",
                    "name": "reward_title",
                    "title": "Reward's title",
                    "placeholder": "Reward's title",
                    "width": "60%",
                    "minWidth": "400px",
                    "startWithNewLine": false,
                    "allowClear": false,
                    "isRequired": true,
                    "requiredErrorText": "This field cannot be empty",
                },
                {
                    "type": "dropdown",
                    "name": "reward_category",
                    "title": "Reward's category",
                    "width": "40%",
                    "minWidth": "150px",
                    "startWithNewLine": false,
                    "isRequired": true,
                    "placeholder": "Reward's category",
                    "choices": ["Vouchers", "Merchandise", "Services"],
                    "defaultValue": "Vouchers",
                    "requiredErrorText": "This field cannot be empty",
                },
                {
                    "type": "text",
                    "name": "reward_available_num",
                    "title": "Reward's numbers",
                    "placeholder": "Available reward's number for redemption",
                    "inputType": "number",
                    "startWithNewLine": false,
                    "min": 1,
                    "max": 100,
                    "isRequired": true,
                    "requiredErrorText": "This field cannot be empty",
                },
                {
                    "type": "text",
                    "name": "reward_redeem_points",
                    "title": "Reward's points",
                    "placeholder": "Required point to redeem reward",
                    "inputType": "number",
                    "startWithNewLine": false,
                    "min": 0,
                    "isRequired": true,
                    "requiredErrorText": "This field cannot be empty",
                },
                {
                    "type": "file",
                    "name": "reward_poster",
                    "title": "Reward's poster",
                    "width": "100%",
                    "minWidth": "256px",
                    "filePlaceholder": "Upload the poster for the reward.",
                    "acceptedTypes": 'image/*',
                    "sourceType": "file",
                    "maxSize": 5242880,
                },
                {
                    "type": "file",
                    "name": "reward_card_image",
                    "title": "Reward's card image",
                    "width": "100%",
                    "minWidth": "256px",
                    "filePlaceholder": "Upload the card image for the reward.",
                    "acceptedTypes": 'image/*',
                    "sourceType": "file",
                    "maxSize": 5242880,
                },
                {
                    "type": "panel",
                    "name": "reward_poster_panel",
                    "title": "Reward's poster",
                    "elements": [
                        {
                            "type": "image",
                            "name": "reward_poster_display",
                            "title": "Reward's poster",
                            "imageHeight": '300',
                            "imageWidth": '100%',
                            "altText": "Reward's poster",
                        },
                    ]
                },
                {
                    "type": "panel",
                    "name": "reward_card_image_panel",
                    "title": "Reward's card image",
                    "elements": [
                        {
                            "type": "image",
                            "name": "reward_card_image_display",
                            "title": "Reward's card image",
                            "imageHeight": '300',
                            "imageWidth": '100%',
                            "altText": "Reward's card image",
                        },
                    ]
                },
                {
                    "type": "editor",
                    "name": "reward_description",
                    "title": "Reward's description",
                    "isRequired": true,
                    "requiredErrorText": "This field cannot be empty",
                }
            ],
        },
    ],
    "showQuestionNumbers": "off",
    "questionErrorLocation": "bottom",
    "completeText": "Submit",
    "questionsOnPageMode": "singlePage",
    "widthMode": "static",
    "width": "904",
    "fitToContainer": true,
    "showCompletedPage": false,
};