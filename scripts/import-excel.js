"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importExcelData = importExcelData;
var XLSX = require("xlsx");
var app_1 = require("firebase/app");
var auth_1 = require("firebase/auth");
var firestore_1 = require("firebase/firestore");
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
var firebaseConfig = {
    apiKey: "AIzaSyByHh2_r9j1npQ-DQyaye9bbge4lEX5Go8",
    authDomain: "nazafati-system.firebaseapp.com",
    projectId: "nazafati-system",
    storageBucket: "nazafati-system.firebasestorage.app",
    messagingSenderId: "233027790289",
    appId: "1:233027790289:web:269414e8ed8f3091b5ecf0",
    measurementId: "G-MTQ23LS55N"
};
// تهيئة Firebase
var app = (0, app_1.initializeApp)(firebaseConfig);
var auth = (0, auth_1.getAuth)(app);
var db = (0, firestore_1.getFirestore)(app);
// دالة لقراءة ملف Excel
function readExcelFile(filePath) {
    try {
        console.log('قراءة ملف Excel...');
        var workbook = XLSX.readFile(filePath);
        var sheetName = workbook.SheetNames[0]; // أول ورقة
        var worksheet = workbook.Sheets[sheetName];
        var data = XLSX.utils.sheet_to_json(worksheet);
        console.log("\u062A\u0645 \u0642\u0631\u0627\u0621\u0629 ".concat(data.length, " \u0635\u0641 \u0645\u0646 \u0627\u0644\u0645\u0644\u0641"));
        return data;
    }
    catch (error) {
        console.error('خطأ في قراءة ملف Excel:', error);
        throw error;
    }
}
// دالة لتحويل البيانات إلى الموظفين
function convertToEmployees(data) {
    console.log('تحويل البيانات إلى موظفين...');
    var employees = [];
    var seenJobNumbers = new Set();
    for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
        var row = data_1[_i];
        // توقع أسماء الأعمدة - قد تحتاج لتعديلها حسب ملفك
        var jobNumber = row['رقم_الوظيفة'] || row['jobNumber'] || row['رقم الوظيفة'] || "EMP".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 5));
        var name_1 = row['اسم_الموظف'] || row['name'] || row['اسم الموظف'] || 'غير محدد';
        var regionName = row['المنطقة'] || row['region'] || row['regionName'] || 'المنطقة الافتراضية';
        // تجنب تكرار أرقام الوظائف
        if (seenJobNumbers.has(jobNumber)) {
            console.warn("\u0631\u0642\u0645 \u0627\u0644\u0648\u0638\u064A\u0641\u0629 \u0645\u0643\u0631\u0631: ".concat(jobNumber, " - \u0633\u064A\u062A\u0645 \u062A\u062C\u0627\u0647\u0644\u0647"));
            continue;
        }
        seenJobNumbers.add(jobNumber);
        // تحديد المنطقة
        var regionId = 'region-default';
        if (regionName.includes('شمال') || regionName.includes('north')) {
            regionId = 'region-1';
        }
        else if (regionName.includes('جنوب') || regionName.includes('south')) {
            regionId = 'region-2';
        }
        else if (regionName.includes('شرق') || regionName.includes('east')) {
            regionId = 'region-3';
        }
        else if (regionName.includes('غرب') || regionName.includes('west')) {
            regionId = 'region-4';
        }
        // حساب الراتب الأساسي (افتراضي)
        var baseSalary = row['الراتب_الاساسي'] || row['baseSalary'] || row['الراتب الأساسي'] || 3000;
        var employee = {
            jobNumber: jobNumber,
            name: name_1,
            baseSalary: Number(baseSalary),
            regionId: regionId,
            status: 'active',
            createdAt: (0, firestore_1.serverTimestamp)(),
            updatedAt: (0, firestore_1.serverTimestamp)()
        };
        employees.push(employee);
    }
    console.log("\u062A\u0645 \u062A\u062D\u0648\u064A\u0644 ".concat(employees.length, " \u0645\u0648\u0638\u0641"));
    return employees;
}
// دالة لتحويل البيانات إلى الإدخالات الشهرية
function convertToMonthlyEntries(data, monthKey) {
    console.log('تحويل البيانات إلى إدخالات شهرية...');
    var entries = [];
    for (var _i = 0, data_2 = data; _i < data_2.length; _i++) {
        var row = data_2[_i];
        var jobNumber = row['رقم_الوظيفة'] || row['jobNumber'] || row['رقم الوظيفة'];
        var name_2 = row['اسم_الموظف'] || row['name'] || row['اسم الموظف'];
        var regionName = row['المنطقة'] || row['region'] || row['regionName'];
        if (!jobNumber || !name_2) {
            console.warn('صف بدون رقم وظيفة أو اسم - سيتم تجاهله');
            continue;
        }
        // تحديد المنطقة
        var regionId = 'region-default';
        if ((regionName === null || regionName === void 0 ? void 0 : regionName.includes('شمال')) || (regionName === null || regionName === void 0 ? void 0 : regionName.includes('north'))) {
            regionId = 'region-1';
        }
        else if ((regionName === null || regionName === void 0 ? void 0 : regionName.includes('جنوب')) || (regionName === null || regionName === void 0 ? void 0 : regionName.includes('south'))) {
            regionId = 'region-2';
        }
        else if ((regionName === null || regionName === void 0 ? void 0 : regionName.includes('شرق')) || (regionName === null || regionName === void 0 ? void 0 : regionName.includes('east'))) {
            regionId = 'region-3';
        }
        else if ((regionName === null || regionName === void 0 ? void 0 : regionName.includes('غرب')) || (regionName === null || regionName === void 0 ? void 0 : regionName.includes('west'))) {
            regionId = 'region-4';
        }
        // استخراج البيانات الرقمية
        var daysWorked = Number(row['ايام_العمل'] || row['daysWorked'] || row['أيام العمل'] || row['ايام العمل'] || 0);
        var overtimeDays = Number(row['ايام_الاضافي'] || row['overtimeDays'] || row['أيام الإضافي'] || row['ايام الاضافي'] || 0);
        var weekendDays = Number(row['ايام_العطل'] || row['weekendDays'] || row['أيام العطل'] || row['ايام العطل'] || 0);
        // حساب الأجر اليومي (افتراضي)
        var baseSalary = Number(row['الراتب_الاساسي'] || row['baseSalary'] || row['الراتب الأساسي'] || 3000);
        var dailyWage = baseSalary / 30;
        // حساب إجمالي الراتب
        var total = (dailyWage * daysWorked) +
            (dailyWage * 1.5 * overtimeDays) +
            (dailyWage * 2 * weekendDays);
        var entry = {
            employeeId: jobNumber,
            monthKey: monthKey,
            daysWorked: daysWorked,
            overtimeDays: overtimeDays,
            weekendDays: weekendDays,
            regionId: regionId,
            submittedBy: 'excel-import',
            status: 'submitted',
            totals: {
                dailyWage: dailyWage,
                total: Math.round(total)
            },
            createdAt: (0, firestore_1.serverTimestamp)(),
            updatedAt: (0, firestore_1.serverTimestamp)()
        };
        entries.push(entry);
    }
    console.log("\u062A\u0645 \u062A\u062D\u0648\u064A\u0644 ".concat(entries.length, " \u0625\u062F\u062E\u0627\u0644 \u0634\u0647\u0631\u064A"));
    return entries;
}
// دالة لإنشاء المراقبين
function createSupervisors() {
    console.log('إنشاء المراقبين...');
    var supervisors = [
        {
            uid: 'supervisor-1',
            name: 'مراقب المنطقة الشمالية',
            email: 'supervisor1@nazafati.com',
            role: 'supervisor',
            regionId: 'region-1',
            createdAt: (0, firestore_1.serverTimestamp)(),
            updatedAt: (0, firestore_1.serverTimestamp)()
        },
        {
            uid: 'supervisor-2',
            name: 'مراقب المنطقة الجنوبية',
            email: 'supervisor2@nazafati.com',
            role: 'supervisor',
            regionId: 'region-2',
            createdAt: (0, firestore_1.serverTimestamp)(),
            updatedAt: (0, firestore_1.serverTimestamp)()
        },
        {
            uid: 'supervisor-3',
            name: 'مراقب المنطقة الشرقية',
            email: 'supervisor3@nazafati.com',
            role: 'supervisor',
            regionId: 'region-3',
            createdAt: (0, firestore_1.serverTimestamp)(),
            updatedAt: (0, firestore_1.serverTimestamp)()
        },
        {
            uid: 'supervisor-4',
            name: 'مراقب المنطقة الغربية',
            email: 'supervisor4@nazafati.com',
            role: 'supervisor',
            regionId: 'region-4',
            createdAt: (0, firestore_1.serverTimestamp)(),
            updatedAt: (0, firestore_1.serverTimestamp)()
        }
    ];
    return supervisors;
}
// دالة لإضافة الموظفين إلى Firestore
function addEmployeesToFirestore(employees) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, employees_1, employee, existingQuery, existingDocs, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('إضافة الموظفين إلى Firestore...');
                    _i = 0, employees_1 = employees;
                    _a.label = 1;
                case 1:
                    if (!(_i < employees_1.length)) return [3 /*break*/, 9];
                    employee = employees_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 7, , 8]);
                    existingQuery = (0, firestore_1.query)((0, firestore_1.collection)(db, 'employees'), (0, firestore_1.where)('jobNumber', '==', employee.jobNumber));
                    return [4 /*yield*/, (0, firestore_1.getDocs)(existingQuery)];
                case 3:
                    existingDocs = _a.sent();
                    if (!existingDocs.empty) return [3 /*break*/, 5];
                    return [4 /*yield*/, (0, firestore_1.addDoc)((0, firestore_1.collection)(db, 'employees'), employee)];
                case 4:
                    _a.sent();
                    console.log("\u062A\u0645 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0648\u0638\u0641: ".concat(employee.name, " (").concat(employee.jobNumber, ")"));
                    return [3 /*break*/, 6];
                case 5:
                    console.log("\u0627\u0644\u0645\u0648\u0638\u0641 \u0645\u0648\u062C\u0648\u062F \u0645\u0633\u0628\u0642\u0627\u064B: ".concat(employee.name, " (").concat(employee.jobNumber, ")"));
                    _a.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_1 = _a.sent();
                    console.error("\u062E\u0637\u0623 \u0641\u064A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0648\u0638\u0641 ".concat(employee.name, ":"), error_1);
                    return [3 /*break*/, 8];
                case 8:
                    _i++;
                    return [3 /*break*/, 1];
                case 9: return [2 /*return*/];
            }
        });
    });
}
// دالة لإضافة الإدخالات الشهرية إلى Firestore
function addMonthlyEntriesToFirestore(entries) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, entries_1, entry, entryId, existingDoc, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('إضافة الإدخالات الشهرية إلى Firestore...');
                    _i = 0, entries_1 = entries;
                    _a.label = 1;
                case 1:
                    if (!(_i < entries_1.length)) return [3 /*break*/, 9];
                    entry = entries_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 7, , 8]);
                    entryId = "".concat(entry.monthKey, "_").concat(entry.employeeId);
                    return [4 /*yield*/, (0, firestore_1.getDocs)((0, firestore_1.query)((0, firestore_1.collection)(db, 'monthlyEntries'), (0, firestore_1.where)('employeeId', '==', entry.employeeId), (0, firestore_1.where)('monthKey', '==', entry.monthKey)))];
                case 3:
                    existingDoc = _a.sent();
                    if (!existingDoc.empty) return [3 /*break*/, 5];
                    return [4 /*yield*/, (0, firestore_1.setDoc)((0, firestore_1.doc)(db, 'monthlyEntries', entryId), entry)];
                case 4:
                    _a.sent();
                    console.log("\u062A\u0645 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0625\u062F\u062E\u0627\u0644: ".concat(entry.employeeId, " - ").concat(entry.monthKey));
                    return [3 /*break*/, 6];
                case 5:
                    console.log("\u0627\u0644\u0625\u062F\u062E\u0627\u0644 \u0645\u0648\u062C\u0648\u062F \u0645\u0633\u0628\u0642\u0627\u064B: ".concat(entry.employeeId, " - ").concat(entry.monthKey));
                    _a.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_2 = _a.sent();
                    console.error("\u062E\u0637\u0623 \u0641\u064A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0625\u062F\u062E\u0627\u0644 ".concat(entry.employeeId, ":"), error_2);
                    return [3 /*break*/, 8];
                case 8:
                    _i++;
                    return [3 /*break*/, 1];
                case 9: return [2 /*return*/];
            }
        });
    });
}
// دالة لإضافة المراقبين إلى Firestore
function addSupervisorsToFirestore(supervisors) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, supervisors_1, supervisor, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('إضافة المراقبين إلى Firestore...');
                    _i = 0, supervisors_1 = supervisors;
                    _a.label = 1;
                case 1:
                    if (!(_i < supervisors_1.length)) return [3 /*break*/, 6];
                    supervisor = supervisors_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, (0, firestore_1.setDoc)((0, firestore_1.doc)(db, 'users', supervisor.uid), supervisor)];
                case 3:
                    _a.sent();
                    console.log("\u062A\u0645 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0631\u0627\u0642\u0628: ".concat(supervisor.name));
                    return [3 /*break*/, 5];
                case 4:
                    error_3 = _a.sent();
                    console.error("\u062E\u0637\u0623 \u0641\u064A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0631\u0627\u0642\u0628 ".concat(supervisor.name, ":"), error_3);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// الدالة الرئيسية
function importExcelData(filePath, monthKey) {
    return __awaiter(this, void 0, void 0, function () {
        var excelData, employees, monthlyEntries, supervisors, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    console.log('بدء استيراد البيانات من Excel...');
                    // تسجيل دخول مجهول
                    return [4 /*yield*/, (0, auth_1.signInAnonymously)(auth)];
                case 1:
                    // تسجيل دخول مجهول
                    _a.sent();
                    console.log('تم تسجيل الدخول بنجاح');
                    excelData = readExcelFile(filePath);
                    employees = convertToEmployees(excelData);
                    monthlyEntries = convertToMonthlyEntries(excelData, monthKey);
                    supervisors = createSupervisors();
                    // إضافة البيانات إلى Firestore
                    return [4 /*yield*/, addEmployeesToFirestore(employees)];
                case 2:
                    // إضافة البيانات إلى Firestore
                    _a.sent();
                    return [4 /*yield*/, addMonthlyEntriesToFirestore(monthlyEntries)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, addSupervisorsToFirestore(supervisors)];
                case 4:
                    _a.sent();
                    console.log('تم استيراد جميع البيانات بنجاح!');
                    console.log("\n\u0645\u0644\u062E\u0635 \u0627\u0644\u0627\u0633\u062A\u064A\u0631\u0627\u062F:");
                    console.log("- \u0639\u062F\u062F \u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646: ".concat(employees.length));
                    console.log("- \u0639\u062F\u062F \u0627\u0644\u0625\u062F\u062E\u0627\u0644\u0627\u062A \u0627\u0644\u0634\u0647\u0631\u064A\u0629: ".concat(monthlyEntries.length));
                    console.log("- \u0639\u062F\u062F \u0627\u0644\u0645\u0631\u0627\u0642\u0628\u064A\u0646: ".concat(supervisors.length));
                    return [3 /*break*/, 6];
                case 5:
                    error_4 = _a.sent();
                    console.error('خطأ في استيراد البيانات:', error_4);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// تشغيل السكريبت
if (require.main === module) {
    var filePath = process.argv[2];
    var monthKey = process.argv[3] || new Date().toISOString().slice(0, 7); // YYYY-MM
    if (!filePath) {
        console.error('يرجى تحديد مسار ملف Excel');
        console.log('مثال: npm run import-excel ./data.xlsx 2024-09');
        process.exit(1);
    }
    importExcelData(filePath, monthKey);
}
