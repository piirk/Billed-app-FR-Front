/**
 * @jest-environment jsdom
 */

import LoginUI from "../../views/LoginUI";
import Login from "../../containers/Login.js";
import { ROUTES, ROUTES_PATH } from "../../constants/routes";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import userEvent from '@testing-library/user-event';
import BillsUI from "../../views/BillsUI.js";
import DashboardUI from "../../views/DashboardUI.js";
import Bills from "../../containers/Bills.js";
import Logout from "../../containers/Logout.js";
import { bills } from "../../fixtures/bills.js";
import { localStorageMock } from "../../__mocks__/localStorage.js";
import '@testing-library/jest-dom';

describe("Given that I am a user on login page", () => {
  describe("When I do not fill fields and I click on employee button Login In", () => {
    test("Then It should renders Login page", () => {
      document.body.innerHTML = LoginUI();

      const inputEmailUser = screen.getByTestId("employee-email-input");
      expect(inputEmailUser.value).toBe("");

      const inputPasswordUser = screen.getByTestId("employee-password-input");
      expect(inputPasswordUser.value).toBe("");

      const form = screen.getByTestId("form-employee");
      const handleSubmit = jest.fn((e) => e.preventDefault());

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(screen.getByTestId("form-employee")).toBeTruthy();
    });
  });

  describe("When I do fill fields in incorrect format and I click on employee button Login In", () => {
    test("Then It should renders Login page", () => {
      document.body.innerHTML = LoginUI();

      const inputEmailUser = screen.getByTestId("employee-email-input");
      fireEvent.change(inputEmailUser, { target: { value: "pasunemail" } });
      expect(inputEmailUser.value).toBe("pasunemail");

      const inputPasswordUser = screen.getByTestId("employee-password-input");
      fireEvent.change(inputPasswordUser, { target: { value: "azerty" } });
      expect(inputPasswordUser.value).toBe("azerty");

      const form = screen.getByTestId("form-employee");
      const handleSubmit = jest.fn((e) => e.preventDefault());

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(screen.getByTestId("form-employee")).toBeTruthy();
    });
  });

  describe("When I do fill fields in correct format and I click on employee button Login In", () => {
    test("Then I should be identified as an Employee in app", () => {
      document.body.innerHTML = LoginUI();
      const inputData = {
        email: "johndoe@email.com",
        password: "azerty",
      };

      const inputEmailUser = screen.getByTestId("employee-email-input");
      fireEvent.change(inputEmailUser, { target: { value: inputData.email } });
      expect(inputEmailUser.value).toBe(inputData.email);

      const inputPasswordUser = screen.getByTestId("employee-password-input");
      fireEvent.change(inputPasswordUser, {
        target: { value: inputData.password },
      });
      expect(inputPasswordUser.value).toBe(inputData.password);

      const form = screen.getByTestId("form-employee");

      // localStorage should be populated with form data
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: jest.fn(() => null),
          setItem: jest.fn(() => null),
        },
        writable: true,
      });

      // we have to mock navigation to test it
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      let PREVIOUS_LOCATION = "";

      const store = jest.fn();

      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION,
        store,
      });

      const handleSubmit = jest.fn(login.handleSubmitEmployee);
      login.login = jest.fn().mockResolvedValue({});
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
      expect(window.localStorage.setItem).toHaveBeenCalled();
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify({
          type: "Employee",
          email: inputData.email,
          password: inputData.password,
          status: "connected",
        })
      );
    });

    test("It should renders Bills page", () => {
      expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
    });
  });
});

describe('Given I am connected as an Employee and I am on Bills Page', () => {
  describe('When I click on the eye icon', () => {
    test('Then it should renders the modal', async () => {
      const user = userEvent.setup();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const store = jest.fn();

      const billsList = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage
      });

      document.body.innerHTML = BillsUI({ data: bills });

      await waitFor(() => screen.getAllByTestId('icon-eye')[0]);
      const iconEye = screen.getAllByTestId('icon-eye')[0];
      expect(iconEye).toBeTruthy();
      
      $.fn.modal = jest.fn();
      $.fn.width = jest.fn().mockReturnValue(500);
      $.fn.find = jest.fn().mockReturnThis();
      $.fn.html = jest.fn();
      
      const handleClickIconEye = jest.fn(() => {
        billsList.handleClickIconEye(iconEye);
      });

      iconEye.addEventListener('click', handleClickIconEye);

      await user.click(iconEye);
      expect(handleClickIconEye).toHaveBeenCalled();
      expect($.fn.modal).toHaveBeenCalledWith('show');

      const billUrl = iconEye.getAttribute('data-bill-url');
      const imgWidth = Math.floor($('#modaleFile').width() * 0.5);

      $('#modaleFile').find('.modal-body').html(
        `<div style='text-align: center;' class="bill-proof-container">
          <img width=${imgWidth} src=${billUrl} alt="Bill" />
        </div>`);

      expect($.fn.find).toHaveBeenCalled();
      expect($.fn.html).toHaveBeenCalledWith(
        `<div style='text-align: center;' class="bill-proof-container">
          <img width=${imgWidth} src=${billUrl} alt="Bill" />
        </div>`
      );
      expect($.fn.width).toHaveBeenCalled();
      expect(imgWidth).toBe(250);
    });
  });

  describe('When I click on disconnect button', () => {
    test(('Then, I should be sent to login page'), async () => {

      const user = userEvent.setup();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      document.body.innerHTML = DashboardUI({ bills })
      const logout = new Logout({ document, onNavigate, localStorage })
      const handleClick = jest.fn(logout.handleClick)

      const disco = screen.getByTestId('layout-disconnect')
      disco.addEventListener('click', handleClick)
      await user.click(disco)
      expect(handleClick).toHaveBeenCalled()
      expect(screen.getByText('Employé')).toBeTruthy()
    });
  });
});
