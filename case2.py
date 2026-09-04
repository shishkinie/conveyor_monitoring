def assign_manager(manager1_busy, manager2_busy, manager3_busy, queue_length):

    
    if not manager1_busy and not manager2_busy and not manager3_busy:
        manager_num = 1
    elif manager1_busy and not manager2_busy and not manager3_busy:
        manager_num = 2
    elif not manager1_busy and manager2_busy and not manager3_busy:
        manager_num = 3
    elif manager1_busy and manager2_busy and not manager3_busy:
        manager_num = 3
    elif not manager1_busy and manager2_busy and manager3_busy:
        manager_num = 1
    elif manager1_busy and not manager2_busy and manager3_busy:
        manager_num = 2
    elif not manager1_busy and not manager2_busy and manager3_busy:
        manager_num = 1
  
    elif manager1_busy and manager2_busy and manager3_busy:
        if queue_length < 2:
            manager_num = "Ожидание"
        else:
            manager_num = "Главный менеджер"
    else:
    
        manager_num = "Ошибка"
    return manager_num


def main():

    print("Введите статус занятости менеджеров (1 - занят, 0 - свободен):")
    m1 = input("Менеджер 1: ").strip() == "1"
    m2 = input("Менеджер 2: ").strip() == "1"
    m3 = input("Менеджер 3: ").strip() == "1"
    q = int(input("Введите количество клиентов в очереди: "))

    manager_num = assign_manager(m1, m2, m3, q)


    print(f"Ваш менеджер - {manager_num}")


if __name__ == "__main__":
    main()