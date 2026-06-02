from opcua import Server
import time
import random

# 1. Criar servidor
server = Server()

# 2. Endpoint
server.set_endpoint("opc.tcp://0.0.0.0:4840")

# 3. Namespace
uri = "http://ads.freeopcua.server"
idx = server.register_namespace(uri)

# 4. Objeto principal
objects = server.get_objects_node()
sensor = objects.add_object(idx, "Sensor")

# 5. Variáveis
temperature = sensor.add_variable(idx, "Temperature", 0.0)
pressure = sensor.add_variable(idx, "Pressure", 0.0)
running = sensor.add_variable(idx, "Running", False)

# 6. Permitir escrita externa
temperature.set_writable()
pressure.set_writable()
running.set_writable()

# 7. Subir servidor
server.start()
print("OPC-UA Server rodando em opc.tcp://localhost:4840")

try:
    # Valores iniciais
    temp_val = 25.0
    pres_val = 2.5
    run_val = True

    while True:
        # Simulação de processo industrial com variação aleatória
        temp_val += random.uniform(-2.0, 2.5)
        temp_val = max(5.0, min(95.0, temp_val))

        pres_val += random.uniform(-0.3, 0.35)
        pres_val = max(0.2, min(6.0, pres_val))

        # Status muda raramente (~5% de chance)
        if random.random() < 0.05:
            run_val = not run_val

        temperature.set_value(round(temp_val, 2))
        pressure.set_value(round(pres_val, 2))
        running.set_value(run_val)
        
        output = {
            "Temperatura" : temperature.get_value(),
            "Pressão" : pressure.get_value(),
            "Status" : running.get_value(),
        }

        print(output)

        time.sleep(1)

finally:
    server.stop()
