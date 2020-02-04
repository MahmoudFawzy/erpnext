// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt
//	https://abdennour.github.io/hijri-date/


frappe.provide("erpnext.hr");
erpnext.hr.EmployeeController = frappe.ui.form.Controller.extend({
	setup: function () {
		this.frm.fields_dict.user_id.get_query = function (doc, cdt, cdn) {
			return {
				query: "frappe.core.doctype.user.user.user_query",
				filters: { ignore_user_type: 1 }
			}
		}
		this.frm.fields_dict.reports_to.get_query = function (doc, cdt, cdn) {
			return { query: "erpnext.controllers.queries.employee_query" }
		}
	},

	refresh: function () {
		var me = this;
		erpnext.toggle_naming_series();
	},

	date_of_birth: function () {
		return cur_frm.call({
			method: "get_retirement_date",
			args: { date_of_birth: this.frm.doc.date_of_birth }
		});
	},

	salutation: function () {
		if (this.frm.doc.salutation) {
			this.frm.set_value("gender", {
				"Mr": "Male",
				"Ms": "Female"
			}[this.frm.doc.salutation]);
		}
	},
});
frappe.ui.form.on('Employee', {
	setup: function (frm) {
		frm.set_query("leave_policy", function () {
			return {
				"filters": {
					"docstatus": 1
				}
			};
		});
	},
	onload: function (frm) {
		frappe.require([
			"assets/erpnext/js/hijri-date-latest.min.js"
		]);

		frm.set_query("department", function () {
			return {
				"filters": {
					"company": frm.doc.company,
				}
			};
		});
	},
	prefered_contact_email: function (frm) {
		frm.events.update_contact(frm)
	},
	personal_email: function (frm) {
		frm.events.update_contact(frm)
	},
	company_email: function (frm) {
		frm.events.update_contact(frm)
	},
	user_id: function (frm) {
		frm.events.update_contact(frm)
	},
	update_contact: function (frm) {
		var prefered_email_fieldname = frappe.model.scrub(frm.doc.prefered_contact_email) || 'user_id';
		frm.set_value("prefered_email",
			frm.fields_dict[prefered_email_fieldname].value)
	},
	status: function (frm) {
		return frm.call({
			method: "deactivate_sales_person",
			args: {
				employee: frm.doc.employee,
				status: frm.doc.status
			}
		});
	},
	create_user: function (frm) {
		if (!frm.doc.prefered_email) {
			frappe.throw(__("Please enter Preferred Contact Email"))
		}
		frappe.call({
			method: "erpnext.hr.doctype.employee.employee.create_user",
			args: { employee: frm.doc.name, email: frm.doc.prefered_email },
			callback: function (r) {
				frm.set_value("user_id", r.message)
			}
		});
	},
	// date_of_birth: function (frm) {
	// 	let mom = moment(frm.doc.date_of_birth, 'YYYY-MM-DD')
	// 	if (mom.isValid()) {
	// 		frm.set_value("date_of_birth_hijri", mom.locale('en').format('iD/iM/iYYYY'), () => { })
	// 	}
	// },
	date_of_birth_hijri: function (frm) {
		const h_date = new HijriDate(frm.doc.date_of_birth_hijri, "yyyy/mm/dd");
		var mom = moment(h_date.toGregorian());
		if (mom.isValid()) {
			frm.set_value("date_of_birth", mom.format('YYYY-MM-DD'));
		}
	},
	residency_renewal_hijri: function (frm) {
		const h_date = new HijriDate(frm.doc.residency_renewal_hijri, "yyyy/mm/dd");
		var mom = moment(h_date.toGregorian());
		if (mom.isValid()) {
			frm.set_value("residency_renewal", mom.format('YYYY-MM-DD'));
		}
	},
	residency_update: function (frm) {

		const h_date = new HijriDate(frm.doc.residency_issue_date_hajiri, "yyyy/mm/dd");
		var mom = moment(h_date.toGregorian());
		if (mom.isValid()) {
			frm.set_value("residency_renewal_hijri", mom.add(12, 'M')._d.toHijri().format('yyyy-mm-dd'));
			frm.set_value("residency_renewal", mom.add(12, 'M').format('YYYY-MM-DD'));
		}
	},
	the_date_of_issue_visa_hijri: function (frm) {
		const h_date = new HijriDate(frm.doc.the_date_of_issue_visa_hijri, "yyyy/mm/dd");
		var mom = moment(h_date.toGregorian());
		if (mom.isValid()) {
			frm.set_value("the_date_of_issue_visa", mom.format('YYYY-MM-DD'));
			let dd = mom.add(3, 'M')._d.toHijri();
			let dd_str = dd.format('yyyy-mm-dd');
			frm.set_value("residency_issue_date_hajiri", dd_str);
			frm.set_value("residency_renewal_hijri", dd_str);
			frm.set_value("residency_renewal", mom.add(3, 'M').format('YYYY-MM-DD'));
		}
	},
	national_id_expiry_date_hijri: function (frm) {
		const h_date = new HijriDate(frm.doc.national_id_expiry_date_hijri, "yyyy/mm/dd");
		var mom = moment(h_date.toGregorian());
		if (mom.isValid()) {
			frm.set_value("national_id_expiry_date", mom.format('YYYY-MM-DD'));
		}
	},
	date_of_joining: function (frm) {
		frm.events.calc_contract_end(frm)
	},
	contract_years: function (frm) {
		frm.events.calc_contract_end(frm)
	},
	contract_monthes: function (frm) {
		frm.events.calc_contract_end(frm)
	},
	calc_contract_end: function (frm) {
		var mom = moment(frm.doc.date_of_joining, "YYYY-MM-DD");

		if (mom.isValid()) {
			if (frm.doc.contract_years) {
				mom.add(parseInt(frm.doc.contract_years), 'years');
			}
			if (frm.doc.contract_monthes) {
				mom.add(parseInt(frm.doc.contract_monthes), 'months');
			}

			frm.set_value("contract_end_date", mom.format('YYYY-MM-DD'));
		}
	}
});
cur_frm.cscript = new erpnext.hr.EmployeeController({ frm: cur_frm });
