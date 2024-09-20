/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import Bills from "../containers/Bills.js"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBe(true)

    })
    test("Then bills should be ordered from earliest to latest", () => {

      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)

    })
    test("then the new bill button should be displayed", async () => {
      document.body.innerHTML = BillsUI({ data: bills })
      await waitFor(() => screen.getByTestId('btn-new-bill'))
      const newBillButton = screen.getByTestId('btn-new-bill')
      expect(newBillButton).toBeTruthy()
    })
    describe("when i call getBills", () => {
      let billsInstance;

      beforeEach( () => {
        billsInstance = new Bills({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage,
        });
      });

      it("should fetch bills from the mock API store and ", async () => {
        const result = await billsInstance.getBills();
  
        expect(result.length).toBe(4);
        expect(result[0].status).toBe("En attente");
        expect(result[1].status).toBe("Refusé");
        expect(result[2].status).toBe("Accepté");
      });

      // a garder même si le formatDate est retiré de Bills.js ? ici pour 100% de couverture
      /*
      it("should log an error and return unformatted data if formatting fails", async () => {
        const mockFormatDate = jest.fn(() => {
          throw new Error("Erreur de formatage");
        });
    
        jest.mock("../app/format.js", () => ({
          formatDate: mockFormatDate,
          formatStatus: jest.requireActual("../app/format.js").formatStatus,
        }));
    
        const consoleSpy = jest.spyOn(console, "log");
        const result = await billsInstance.getBills();
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error), "for", expect.any(Object));
        expect(result[0].date).toBe("2004-04-04");
    
        jest.resetModules();
      });
      */
    });
    describe('When I click on the eye icon', () => {
      test('Then it should renders the modal', async () => {
        const user = userEvent.setup();
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const billsInstance = new Bills({
          document,
          onNavigate,
          mockStore,
          localStorage: window.localStorage
        });
  
        await waitFor(() => screen.getAllByTestId('icon-eye')[0]);
        const iconEye = screen.getAllByTestId('icon-eye')[0];
        expect(iconEye).toBeTruthy();
        
        $.fn.modal = jest.fn();
        $.fn.width = jest.fn().mockReturnValue(500);
        $.fn.find = jest.fn().mockReturnThis();
        $.fn.html = jest.fn();
        
        const handleClickIconEye = jest.fn(() => {
          billsInstance.handleClickIconEye(iconEye);
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

    describe("when i click on the new bill button", () => {
      test("then the new bill form should display", async () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
      
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
      
        document.body.innerHTML = BillsUI({ data: bills })
      
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        const store = jest.fn();

        new Bills({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage
        })
      
        await waitFor(() => screen.getByTestId('btn-new-bill'))
        const newBillButton = screen.getByTestId('btn-new-bill')
      
        fireEvent.click(newBillButton)

        await waitFor(() => {
          const formNewBill = screen.queryByTestId('form-new-bill')
          expect(formNewBill).toBeTruthy()
        })
      })
    })
  })
})
