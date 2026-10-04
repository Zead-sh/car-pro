/* ملف JavaScript/JQuery الوحيد للمشروع */

$(document).ready(function () {

    /* 1) إظهار وإخفاء تفاصيل السيارات باستخدام JQuery */
    $(".details-toggle").on("change", function () {
        $(this).closest("td").find(".car-details").stop(true, true).slideToggle(200);
    });

    /* 2) زر متابعة: إظهار نموذج الحجز في الصفحة نفسها */
    $("#continueButton").on("click", function () {
        var selected = getSelectedCars();

        if (selected.length === 0) {
            $("#selectionMessage").text("يرجى اختيار سيارة واحدة على الأقل قبل المتابعة.");
            $("#bookingSection").addClass("hidden");
            return;
        }

        $("#selectionMessage").text("");
        $("#selectedCarsText").text(selected.join("، "));
        $("#bookingSection").removeClass("hidden");
        $("#bookingSection").hide().fadeIn(300);

        $("html, body").animate({
            scrollTop: $("#bookingSection").offset().top - 20
        }, 500);
    });

    /* 3) التحقق من النموذج وحساب النتيجة */
    $("#bookingForm").on("submit", function (event) {
        event.preventDefault();

        clearErrors();

        var selected = getSelectedCars();
        if (selected.length === 0) {
            $("#selectionMessage").text("يرجى اختيار سيارة واحدة على الأقل.");
            return;
        }

        var valid = true;

        var fullName = $.trim($("#fullName").val());
        var nationalId = $.trim($("#nationalId").val());
        var startText = $.trim($("#startDate").val());
        var endText = $.trim($("#endDate").val());
        var mobile = $.trim($("#mobile").val());
        var email = $.trim($("#email").val());

        /* الاسم: أحرف عربية ومسافات فقط */
        var arabicNamePattern = /^[\u0600-\u06FF\u0750-\u077F\s]+$/;
        if (fullName === "" || !arabicNamePattern.test(fullName)) {
            $("#fullNameError").text("الاسم مطلوب ويجب أن يحتوي على أحرف عربية فقط.");
            valid = false;
        }

        /* الرقم الوطني: 11 خانة، وأول خانتين 01-14 */
        var nationalIdPattern = /^(0[1-9]|1[0-4])\d{9}$/;
        if (!nationalIdPattern.test(nationalId)) {
            $("#nationalIdError").text("الرقم الوطني يجب أن يتكون من 11 خانة وأن تبدأ أول خانتين برمز محافظة من 01 إلى 14.");
            valid = false;
        }

        /* التاريخان بصيغة dd-mm-yyyy */
        var startDate = parseDateDMY(startText);
        var endDate = parseDateDMY(endText);

        if (startDate === null) {
            $("#startDateError").text("أدخل تاريخ البداية بصيغة صحيحة dd-mm-yyyy.");
            valid = false;
        }

        if (endDate === null) {
            $("#endDateError").text("أدخل تاريخ النهاية بصيغة صحيحة dd-mm-yyyy.");
            valid = false;
        }

        if (startDate !== null && endDate !== null) {
            if (endDate.getTime() <= startDate.getTime()) {
                $("#endDateError").text("يجب أن يكون تاريخ النهاية لاحقاً لتاريخ البداية.");
                valid = false;
            }
        }

        /* رقم الموبايل: صيغة شبكات الموبايل السورية */
        var mobilePattern = /^09(3|4|5|8|9)\d{7}$/;
        if (mobile !== "" && !mobilePattern.test(mobile)) {
            $("#mobileError").text("رقم الموبايل غير صحيح. مثال صحيح: 0931234567.");
            valid = false;
        }

        /* البريد الإلكتروني اختياري */
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email !== "" && !emailPattern.test(email)) {
            $("#emailError").text("صيغة البريد الإلكتروني غير صحيحة.");
            valid = false;
        }

        if (!valid) {
            return;
        }

        var days = calculateDays(startDate, endDate);
        var totalBeforeDiscount = 0;
        var rows = "";

        for (var i = 0; i < selected.length; i++) {
            var car = getCarByCode(selected[i]);
            var carTotal = car.price * days;
            totalBeforeDiscount += carTotal;

            rows += "<tr>" +
                "<td>" + car.code + "</td>" +
                "<td>" + car.model + "</td>" +
                "<td>" + days + "</td>" +
                "<td>" + formatNumber(car.price) + " س.ل</td>" +
                "<td>" + formatNumber(carTotal) + " س.ل</td>" +
                "</tr>";
        }

        var discount = 0;
        if (days > 7) {
            discount = totalBeforeDiscount * 0.10;
        }

        var finalTotal = totalBeforeDiscount - discount;

        var resultHtml =
            "<h2>تم التحقق من الطلب بنجاح</h2>" +
            "<p><strong>السيارات المختارة:</strong> " + selected.join("، ") + "</p>" +
            "<p><strong>مدة التأجير:</strong> " + days + " يوم</p>" +
            "<table class='result-table'>" +
                "<tr>" +
                    "<th>الرمز</th>" +
                    "<th>السيارة</th>" +
                    "<th>عدد الأيام</th>" +
                    "<th>السعر اليومي</th>" +
                    "<th>المجموع</th>" +
                "</tr>" +
                rows +
            "</table>" +
            "<p><strong>المجموع قبل الخصم:</strong> " + formatNumber(totalBeforeDiscount) + " س.ل</p>" +
            "<p><strong>الخصم:</strong> " + formatNumber(discount) + " س.ل" +
                (days > 7 ? " (10% لأن المدة تتجاوز 7 أيام)" : " (لا يوجد خصم لأن المدة لا تتجاوز 7 أيام)") +
            "</p>" +
            "<p><strong>المبلغ النهائي:</strong> " + formatNumber(finalTotal) + " س.ل</p>" +
            "<p class='note'>هذه نافذة نتيجة تعليمية للمشروع ولا تمثل حجزاً فعلياً لدى مكتب حقيقي.</p>";

        $("#resultBox").html(resultHtml).removeClass("hidden").hide().fadeIn(400);

        $("html, body").animate({
            scrollTop: $("#resultBox").offset().top - 20
        }, 500);
    });

    /* مسح النتائج والأخطاء عند إعادة ضبط النموذج */
    $("#resetButton").on("click", function () {
        clearErrors();
        $("#resultBox").addClass("hidden").html("");
    });
});


function clearErrors() {
    $("#selectionMessage").text("");
    $(".field-error").text("");
}


function getSelectedCars() {
    var selected = [];

    $(".car-select:checked").each(function () {
        selected.push($(this).val());
    });

    return selected;
}


function parseDateDMY(value) {
    var pattern = /^(\d{2})-(\d{2})-(\d{4})$/;
    var match = value.match(pattern);

    if (!match) {
        return null;
    }

    var day = parseInt(match[1], 10);
    var month = parseInt(match[2], 10);
    var year = parseInt(match[3], 10);

    if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1) {
        return null;
    }

    var date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day) {
        return null;
    }

    return date;
}


function calculateDays(startDate, endDate) {
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    return Math.round((endDate.getTime() - startDate.getTime()) / millisecondsPerDay);
}


function getCarByCode(code) {
    var cars = [
        { code: "CR-001", model: "Toyota Corolla", price: 250000 },
        { code: "CR-002", model: "Kia Sportage", price: 400000 },
        { code: "CR-003", model: "Hyundai Elantra", price: 300000 },
        { code: "CR-004", model: "Chevrolet Spark", price: 180000 },
        { code: "CR-005", model: "Nissan Sunny", price: 220000 }
    ];

    for (var i = 0; i < cars.length; i++) {
        if (cars[i].code === code) {
            return cars[i];
        }
    }

    return null;
}


function formatNumber(number) {
    return number.toLocaleString("en-US");
}
