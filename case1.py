oil_work_price = 500
oil_work_time = 0.7
oil_work_cost = oil_work_price * oil_work_time

oil_base_price = 700
oil_markup = 0.05
oil_price = oil_base_price * (1 + oil_markup)

filtr_work_price = 450
filtr_work_time = 0.5
filtr_work = filtr_work_price * filtr_work_time

filtr_base_price = 300
filtr_markup = 0.05
filtr_price = filtr_base_price * (1 + filtr_markup)

cost_sum = oil_work_cost + oil_price + filtr_work + filtr_price
discount = 0.03
net_sum_cost = cost_sum * (1 - discount)

print(f"""Расчет работ по представленному автомобилю:
Замена масла (работы)…………. {oil_work_cost} руб.
Масло Castrol…………………………. {oil_price} руб.
Замена воздушного фильтра…. {filtr_work} руб.
Воздушный фильтр………………… {filtr_price} руб.
Итого……………………………………….. {cost_sum} руб.
Персональная скидка……………………..………. 3%
Итого с учетом скидки……………. {net_sum_cost}
Спасибо, что выбираете Нас!""")

